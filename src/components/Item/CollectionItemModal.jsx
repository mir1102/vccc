import React, { useState, useEffect } from 'react';
import Modal from '../UI/Modal';
import { Star, Upload, X as XIcon } from 'lucide-react';
import { itemService } from '../../services/itemService';
import './ModalForm.css'; // Ensure styles are available

const CollectionItemModal = ({ isOpen, onClose, category, onSave, initialDate }) => {
    const [formData, setFormData] = useState({});

    // Helper for Local YYYY-MM-DD
    const getLocalDateString = (date) => {
        if (!date) return '';
        const offset = date.getTimezoneOffset() * 60000;
        const localISOTime = (new Date(date - offset)).toISOString().slice(0, 10);
        return localISOTime;
    };

    // Helper for Local HH:MM
    const getLocalTimeString = (date) => {
        if (!date) return '';
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    };

    useEffect(() => {
        if (isOpen && category?.schema) {
            const initialData = {};
            const now = new Date();
            const defaultDate = initialDate || now;

            category.schema.forEach(col => {
                if (col.type === 'date') {
                    initialData[col.id] = getLocalDateString(defaultDate);
                } else if (col.type === 'time') {
                    initialData[col.id] = getLocalTimeString(now);
                }
            });
            setFormData(initialData);
        }
    }, [isOpen, initialDate, category]);

    const handleChange = (id, value) => {
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleFileChange = (e, id) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => handleChange(id, reader.result);
        reader.readAsDataURL(file);
    };

    const handleSubmit = async () => {
        // Construct item object
        // For standard list (no schema), we might need a default 'content' field
        let itemPayload = {};

        if (category.schema && category.schema.length > 0) {
            itemPayload = {
                customValues: formData,
                content: Object.values(formData)[0] || 'New Item', // Fallback title
                // We might want to explicitly map specific fields if they serve as 'title'
            };
        } else {
            // Standard simple item
            itemPayload = {
                content: formData['default_content'] || '',
                // date: initialDate // If we had a standard date field
            };
        }

        // Add Date if provided and not already covered (or override?)
        if (initialDate) {
            itemPayload.date = initialDate;
        }

        await onSave(itemPayload);
        onClose();
    };

    const renderFormInput = (col) => {
        const value = formData[col.id] || '';

        // ... (Reuse renderFormInput logic from CollectionDetail) ...
        // I will copy the render logic here

        const renderInputContent = () => {
            switch (col.type) {
                case 'long-text':
                    return <textarea className="form-textarea" placeholder="내용을 입력하세요" value={value} onChange={e => handleChange(col.id, e.target.value)} />;
                case 'number':
                    return <input type="number" className="form-input" placeholder="숫자 입력" value={value} onChange={e => handleChange(col.id, e.target.value)} />;
                case 'rating':
                    return (
                        <div style={{ display: 'flex', gap: '4px', padding: '8px 0' }}>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <div key={star} style={{ cursor: 'pointer' }} onClick={() => handleChange(col.id, star)}>
                                    <Star size={24} fill={(Number(value) || 0) >= star ? "#fbbf24" : "none"} color={(Number(value) || 0) >= star ? "#fbbf24" : "#d1d5db"} />
                                </div>
                            ))}
                        </div>
                    );
                case 'date':
                    return <input type="date" className="form-input" value={value} onChange={e => handleChange(col.id, e.target.value)} />;
                case 'time':
                    return <input type="time" className="form-input" value={value} onChange={e => handleChange(col.id, e.target.value)} />;
                case 'checkbox':
                    return (
                        <div className="form-field checkbox-field" onClick={() => handleChange(col.id, !value)}>
                            <input type="checkbox" className="checkbox-input" checked={!!value} onChange={e => handleChange(col.id, e.target.checked)} onClick={e => e.stopPropagation()} />
                            <span className="checkbox-label">{col.name}</span>
                        </div>
                    );
                case 'file':
                    // ... File logic ...
                    return (
                        <div className="file-upload-wrapper">
                            <input type="file" id={`file-${col.id}`} className="file-input-hidden" onChange={(e) => handleFileChange(e, col.id)} />
                            {!value ? (
                                <label htmlFor={`file-${col.id}`} className="file-upload-btn">
                                    <Upload size={20} /><span>파일/이미지 선택</span>
                                </label>
                            ) : (
                                <div className="file-preview">
                                    {typeof value === 'string' && value.startsWith('data:image') ? <img src={value} alt="preview" /> : <div>📎 파일 선택됨</div>}
                                    <button className="remove-file-btn" onClick={() => handleChange(col.id, '')}><XIcon size={16} /></button>
                                </div>
                            )}
                        </div>
                    );
                case 'select':
                case 'status':
                    return (
                        <select className="form-select" value={value || ''} onChange={e => handleChange(col.id, e.target.value)}>
                            <option value="">선택하세요</option>
                            {col.options?.split(',').map(opt => <option key={opt.trim()} value={opt.trim()}>{opt.trim()}</option>)}
                        </select>
                    );
                default:
                    return <input type="text" className="form-input" placeholder="내용을 입력하세요" value={value} onChange={e => handleChange(col.id, e.target.value)} />;
            }
        };

        if (col.type === 'checkbox') {
            return <div key={col.id} style={{ marginBottom: '10px' }}>{renderInputContent()}</div>;
        }
        return (
            <div key={col.id} className="form-field">
                <label className="form-label">{col.name}</label>
                {renderInputContent()}
            </div>
        );
    };

    if (!category) return null;

    const dateTitle = initialDate ? ` (${initialDate.getMonth() + 1}월 ${initialDate.getDate()}일)` : '';

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`${category.name} 항목 추가${dateTitle}`} className="notranslate">
            <div className="item-form-container" style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '4px' }}>
                {category.schema ? (
                    category.schema.map(col => renderFormInput(col))
                ) : (
                    // Fallback for simple category without schema
                    <div className="form-field">
                        <label className="form-label">내용</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="할 일을 입력하세요"
                            value={formData['default_content'] || ''}
                            onChange={e => handleChange('default_content', e.target.value)}
                            autoFocus
                        />
                    </div>
                )}
            </div>
            <button onClick={handleSubmit} className="submit-btn-large" style={{ backgroundColor: category.color || 'var(--primary-color)' }}>
                저장하기
            </button>
            <div style={{ height: '20px' }}></div>
        </Modal>
    );
};

export default CollectionItemModal;
