import React, { useState } from 'react';
import { Trash2, Plus, Edit2, Check, Star, Clock, Calendar, Archive, Bell, Copy } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../lib/firebase';
import ContextMenu from '../UI/ContextMenu';
import SimpleTimer from '../Tools/SimpleTimer';
import ItemDetailModal from './ItemDetailModal';
import './DynamicTable.css';

const DynamicTable = ({ schema, items, onAddItem, onDeleteItem, onUpdateItem }) => {
    // Schema: [{id, name, type}]
    // Items: [{id, customValues: { [colId]: value }, ...}]

    const [editingRowId, setEditingRowId] = useState(null);
    const [editValues, setEditValues] = useState({}); // Local state for editing
    const [contextMenu, setContextMenu] = useState(null);
    const [isTimerOpen, setIsTimerOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null); // Detail Modal State

    const handleStartEdit = (item) => {
        setEditingRowId(item.id);
        setEditValues(item.customValues || {}); // Initialize with current values
    };

    const handleSaveEdit = (itemId) => {
        // Commit changes only on Save
        if (Object.keys(editValues).length > 0) {
            onUpdateItem(itemId, { customValues: editValues });
        }
        setEditingRowId(null);
        setEditValues({});
    };

    const handleEditChange = (colId, value) => {
        setEditValues(prev => ({ ...prev, [colId]: value }));
    };

    // Context Menu Handler
    const handleContextMenu = (e, item) => {
        e.preventDefault();
        setContextMenu({
            x: e.pageX,
            y: e.pageY,
            item: item
        });
    };

    // Action Logic
    const handleDoTomorrow = async (item) => {
        const tomorrow = addDays(new Date(), 1);
        await onUpdateItem(item.id, { date: tomorrow });
        alert("내일로 미루기 완료! 📅");
    };

    const handleSetReminder = async (item) => {
        const time = prompt("알림 시간을 입력하세요 (예: 14:00)");
        if (time) {
            await onUpdateItem(item.id, { reminderAt: time });
            alert(`${time}에 알림이 설정되었습니다.`);
        }
    };

    const handleArchive = async (item) => {
        if (confirm("보관함으로 이동하시겠습니까? (설정 > 보관함에서 확인 가능)")) {
            await onUpdateItem(item.id, { isArchived: true });
        }
    };

    const handleToggleRoutine = async (item) => {
        const isRoutine = !item.recurrence;
        await onUpdateItem(item.id, { recurrence: isRoutine ? 'daily' : null });
        alert(isRoutine ? "매일 반복 루틴으로 등록되었습니다. 🔄" : "루틴이 해제되었습니다.");
    };

    // Formula Evaluation Logic
    const evaluateFormula = (formula, rowValues) => {
        if (!formula) return '';
        try {
            let expression = formula.replace(/\{([^}]+)\}/g, (match, colId) => {
                const val = rowValues[colId];
                return isNaN(Number(val)) ? 0 : Number(val);
            });
            // eslint-disable-next-line no-new-func
            return new Function('return ' + expression)();
        } catch (e) {
            return 'Error';
        }
    };

    const renderInput = (col, value, onChange, isNew = false) => {
        const commonProps = {
            className: isNew ? 'add-row-input' : 'table-input',
            placeholder: isNew ? col.name : '',
            value: value || '',
            onChange: (e) => onChange(e.target.value)
        };

        const handleFileChange = async (e) => {
            if (!e.target.files || e.target.files.length === 0) return;

            const newFiles = Array.from(e.target.files);
            const uploadPromises = newFiles.map(async (file) => {
                try {
                    // Create a unique reference
                    const storageRef = ref(storage, `uploads/${Date.now()}_${file.name}`);
                    // Upload
                    const snapshot = await uploadBytes(storageRef, file);
                    // Get URL
                    const url = await getDownloadURL(snapshot.ref);
                    return url;
                } catch (error) {
                    console.error("Upload failed", error);
                    alert(`업로드 실패: ${file.name}`);
                    return null;
                }
            });

            try {
                // Wait for all uploads
                const results = await Promise.all(uploadPromises);
                const validUrls = results.filter(url => url !== null);

                // Merge with existing logic: value can be array or string
                const currentFiles = Array.isArray(value) ? value : (value ? [value] : []);
                onChange([...currentFiles, ...validUrls]);
            } catch (error) {
                console.error("File upload process error", error);
            }
        };

        switch (col.type) {
            case 'long-text':
                return (
                    <textarea
                        {...commonProps}
                        style={{ height: '100%', resize: 'none', lineHeight: '1.2', paddingTop: '8px' }}
                        rows={1}
                    />
                );
            case 'number':
                return <input type="number" {...commonProps} />;
            case 'rating':
                return (
                    <div style={{ display: 'flex', gap: '2px', padding: '4px' }}>
                        {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                                key={star}
                                size={16}
                                style={{ cursor: 'pointer' }}
                                fill={(Number(value) || 0) >= star ? "#fbbf24" : "none"}
                                color={(Number(value) || 0) >= star ? "#fbbf24" : "#d1d5db"}
                                onClick={() => onChange(star)}
                            />
                        ))}
                    </div>
                );
            case 'date':
                return <input type="date" {...commonProps} />;
            case 'time':
                return <input type="time" {...commonProps} />;
            case 'checkbox':
                return (
                    <div style={{ display: 'flex', justifyContent: 'center', height: '100%', alignItems: 'center' }}>
                        <input
                            type="checkbox"
                            checked={!!value}
                            onChange={(e) => onChange(e.target.checked)}
                            style={{ transform: 'scale(1.2)' }}
                        />
                    </div>
                );
            case 'formula':
                return <input type="text" {...commonProps} disabled placeholder="자동계산" style={{ background: '#f3f4f6', cursor: 'not-allowed' }} />;
            case 'file':
                // Helper to normalize value to array
                const files = Array.isArray(value) ? value : (value ? [value] : []);

                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <label className="icon-btn" style={{ cursor: 'pointer', color: '#6b7280', display: 'flex', alignItems: 'center' }}>
                                <input type="file" multiple style={{ display: 'none' }} onChange={handleFileChange} />
                                <span role="img" aria-label="upload">➕ 추가</span>
                            </label>
                            {files.length > 0 && (
                                <button
                                    onClick={() => onChange([])}
                                    style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '0.8rem' }}
                                    title="전체 삭제"
                                >
                                    비우기
                                </button>
                            )}
                        </div>

                        {/* Edit Mode Preview - Horizontal Scroll */}
                        {files.length > 0 && (
                            <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', maxWidth: '200px', paddingBottom: '4px' }}>
                                {files.map((f, idx) => (
                                    <div key={idx} style={{ position: 'relative', flexShrink: 0 }}>
                                        {typeof f === 'string' && f.startsWith('data:image') ? (
                                            <img src={f} alt={`img-${idx}`} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #ddd' }} />
                                        ) : (
                                            <div style={{ width: '40px', height: '40px', background: '#f3f4f6', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', border: '1px solid #ddd' }}>FILE</div>
                                        )}
                                        <button
                                            onClick={() => onChange(files.filter((_, i) => i !== idx))}
                                            style={{ position: 'absolute', top: '-4px', right: '-4px', background: 'red', color: 'white', borderRadius: '50%', width: '14px', height: '14px', border: 'none', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );
            case 'select':
            case 'status':
                return (
                    <select
                        className={isNew ? 'add-row-input' : 'table-input'}
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value)}
                        style={{ padding: '4px' }}
                    >
                        <option value="">선택...</option>
                        {col.options?.split(',').map(opt => (
                            <option key={opt.trim()} value={opt.trim()}>{opt.trim()}</option>
                        ))}
                    </select>
                );
            default: // text, link
                return <input type="text" {...commonProps} />;
        }
    };

    // Render Read-Only View
    const renderReadOnly = (col, value, item) => {
        if (col.type === 'formula') {
            const calculated = evaluateFormula(col.formula, item.customValues || {});
            return <span style={{ padding: '8px 12px', display: 'block', fontWeight: 'bold' }}>{String(calculated)}</span>;
        }

        if (!value && col.type !== 'checkbox') return <span style={{ color: '#e5e7eb', padding: '8px 12px', display: 'block' }}>-</span>;

        switch (col.type) {
            case 'date':
                if (!value) return <span style={{ color: '#e5e7eb', padding: '8px 12px', display: 'block' }}>-</span>;
                try {
                    const cleanValue = String(value).replace(/[년월일]/g, '').trim();
                    const dateObj = new Date(cleanValue);

                    if (isNaN(dateObj.getTime())) {
                        return <span style={{ padding: '8px 12px', display: 'block' }}>{value}</span>;
                    }
                    return <span style={{ padding: '8px 12px', display: 'block' }}>{format(dateObj, 'yyyy-MM-dd')}</span>;
                } catch (e) {
                    return <span style={{ padding: '8px 12px', display: 'block' }}>{value}</span>;
                }

            case 'checkbox':
                return (
                    <div style={{ display: 'flex', justifyContent: 'center', height: '100%', alignItems: 'center' }}>
                        <input type="checkbox" checked={!!value} disabled style={{ cursor: 'default', transform: 'scale(1.2)' }} />
                    </div>
                );
            case 'link':
                return (
                    <a
                        href={value.toString().startsWith('http') ? value : `https://${value}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: '#2563eb', textDecoration: 'underline', display: 'block', padding: '8px 12px' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {value}
                    </a>
                );
            case 'rating':
                const num = Number(value) || 0;
                return <span style={{ padding: '8px 12px', display: 'block', display: 'flex', alignItems: 'center', gap: '2px' }}>
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} size={14} fill={i < num ? "#fbbf24" : "none"} color={i < num ? "#fbbf24" : "#d1d5db"} />
                    ))}
                </span>;
            case 'status':
                return (
                    <span style={{
                        padding: '4px 10px',
                        borderRadius: '16px',
                        backgroundColor: '#e0f2fe',
                        color: '#0369a1',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        margin: '6px'
                    }}>
                        {value}
                    </span>
                );
            case 'select':
                return <span style={{ padding: '8px 12px', display: 'block' }}>{value}</span>;
            case 'file':
                // Normalize to array
                const fileList = Array.isArray(value) ? value : (value ? [value] : []);
                if (fileList.length === 0) return <span style={{ color: '#e5e7eb', padding: '8px 12px', display: 'block' }}>-</span>;

                const firstFile = fileList[0];
                const isImage = (f) => typeof f === 'string' && (f.startsWith('data:image') || f.includes('firebasestorage') || /\.(jpg|jpeg|png|gif|webp)$/i.test(f));
                const isFirstImage = isImage(firstFile);
                const count = fileList.length;

                if (isFirstImage) {
                    return (
                        <div style={{ padding: '4px', textAlign: 'center', position: 'relative', display: 'inline-block' }}>
                            <img
                                src={firstFile}
                                alt="첨부"
                                style={{ height: '40px', width: 'auto', maxWidth: '100%', borderRadius: '4px', border: '1px solid #e5e7eb' }}
                            />
                            {count > 1 && (
                                <span style={{
                                    position: 'absolute',
                                    bottom: '-5px',
                                    right: '-5px',
                                    background: '#2563eb',
                                    color: 'white',
                                    fontSize: '10px',
                                    fontWeight: 'bold',
                                    padding: '2px 6px',
                                    borderRadius: '10px',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
                                }}>
                                    +{count - 1}
                                </span>
                            )}
                        </div>
                    );
                }
                return (
                    <div style={{ padding: '8px 12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ display: 'block', color: '#4b5563', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            📎 {typeof firstFile === 'string' && firstFile.length > 20 ? '파일' : firstFile}
                        </span>
                        {count > 1 && <span style={{ background: '#e5e7eb', padding: '2px 6px', borderRadius: '10px', fontSize: '0.7rem' }}>+{count - 1}</span>}
                    </div>
                );
            default:
                return <span translate="no" className="notranslate" style={{ padding: '8px 12px', display: 'block', whiteSpace: 'pre-wrap' }}>{value}</span>;
        }
    };

    return (
        <div className="dynamic-table-container">
            {/* Datalists for select options */}
            {schema.filter(col => col.type === 'select' && col.options).map(col => (
                <datalist key={col.id} id={`list-${col.id}`}>
                    {col.options.split(',').map(opt => <option key={opt.trim()} value={opt.trim()} />)}
                </datalist>
            ))}

            <table className="dynamic-table">

                <thead>
                    <tr>
                        {schema.map(col => (
                            <th key={col.id}>{col.name}</th>
                        ))}
                        <th style={{ width: '80px' }}></th>
                    </tr>
                </thead>
                <tbody>
                    {items
                        .filter(item => !item.isArchived) // Filter out archived items
                        .map(item => (
                            <tr
                                key={item.id}
                                data-id={item.id}
                                onContextMenu={(e) => handleContextMenu(e, item)}
                                onClick={() => {
                                    if (editingRowId !== item.id) {
                                        setSelectedItem(item);
                                    }
                                }}
                                style={{ cursor: editingRowId !== item.id ? 'pointer' : 'default' }}
                                className={editingRowId !== item.id ? 'hover:bg-gray-50' : ''}
                            >
                                {schema.map(col => (
                                    <td key={col.id} className={col.type === 'checkbox' ? 'checkbox-cell' : ''}>
                                        {editingRowId === item.id ? (
                                            renderInput(
                                                col,
                                                editValues[col.id] !== undefined ? editValues[col.id] : item.customValues?.[col.id],
                                                (val) => handleEditChange(col.id, val)
                                            )
                                        ) : (
                                            renderReadOnly(col, item.customValues?.[col.id], item)
                                        )}
                                    </td>
                                ))}
                                <td className="actions-cell" onClick={(e) => e.stopPropagation()}>
                                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                                        {editingRowId === item.id ? (
                                            <button
                                                className="icon-btn save"
                                                onClick={() => handleSaveEdit(item.id)}
                                                title="저장"
                                                style={{ color: '#10b981' }}
                                            >
                                                <Check size={16} />
                                            </button>
                                        ) : (
                                            <button
                                                className="icon-btn edit"
                                                onClick={() => handleStartEdit(item)}
                                                title="수정"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                        )}
                                        <button className="icon-btn delete" onClick={() => onDeleteItem(item.id)} title="삭제">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}

                </tbody>
            </table>

            {/* Context Menu */}
            {contextMenu && (
                <ContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    onClose={() => setContextMenu(null)}
                    actions={[
                        { label: '⏰ 시간 알림 설정', icon: <Bell size={16} />, onClick: () => handleSetReminder(contextMenu.item) },
                        { label: '⏱️ 타이머 열기', icon: <Clock size={16} />, onClick: () => setIsTimerOpen(true) },
                        { label: '📅 내일 하기 (미루기)', icon: <Calendar size={16} />, onClick: () => handleDoTomorrow(contextMenu.item) },
                        { label: '🔄 루틴 등록/해제', icon: <Copy size={16} />, onClick: () => handleToggleRoutine(contextMenu.item) },
                        { label: '📦 보관함으로 이동', icon: <Archive size={16} />, onClick: () => handleArchive(contextMenu.item) },
                        { label: '❌ 삭제', icon: <Trash2 size={16} />, danger: true, onClick: () => onDeleteItem(contextMenu.item.id) }
                    ]}
                />
            )}

            {/* Timer Modal */}
            <SimpleTimer
                isOpen={isTimerOpen}
                onClose={() => setIsTimerOpen(false)}
            />

            {/* Item Detail Modal */}
            {selectedItem && (
                <ItemDetailModal
                    item={selectedItem}
                    schema={schema}
                    onClose={() => setSelectedItem(null)}
                />
            )}
        </div>
    );
};

export default DynamicTable;
