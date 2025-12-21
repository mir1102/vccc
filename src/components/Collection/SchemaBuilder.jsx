import React, { useState } from 'react';
import { Plus, X, GripVertical, Type, Hash, Calendar, CheckSquare, AlignLeft, Clock, Paperclip, Calculator, List, Star, Link as LinkIcon, AlertCircle } from 'lucide-react';
import './SchemaBuilder.css';

const COLUMN_TYPES = [
    { id: 'text', label: '텍스트 (짧은내용)', icon: <Type size={16} /> },
    { id: 'long-text', label: '텍스트 (긴내용)', icon: <AlignLeft size={16} /> },
    { id: 'number', label: '숫자', icon: <Hash size={16} /> },
    { id: 'date', label: '날짜', icon: <Calendar size={16} /> },
    { id: 'time', label: '시간', icon: <Clock size={16} /> },
    { id: 'checkbox', label: '체크박스', icon: <CheckSquare size={16} /> },
    { id: 'file', label: '첨부파일 (사진 등)', icon: <Paperclip size={16} /> },
    { id: 'formula', label: '수식', icon: <Calculator size={16} /> },
    // Recommended Additions
    { id: 'select', label: '선택 (Dropdown)', icon: <List size={16} /> },
    { id: 'rating', label: '별점 (Rating)', icon: <Star size={16} /> },
    { id: 'link', label: '링크 (URL)', icon: <LinkIcon size={16} /> },
    { id: 'status', label: '상태 (Status)', icon: <AlertCircle size={16} /> },
];

const SchemaBuilder = ({ schema, onChange }) => {
    // schema = [{ id, name, type }]

    const addColumn = () => {
        const newCol = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9), // Robust fallback for UUID
            name: '',
            type: 'text'
        };
        onChange([...schema, newCol]);
    };

    const removeColumn = (id) => {
        onChange(schema.filter(col => col.id !== id));
    };

    const updateColumn = (id, field, value) => {
        onChange(schema.map(col =>
            col.id === id ? { ...col, [field]: value } : col
        ));
    };

    return (
        <div className="schema-builder">
            <div className="schema-header">
                <label>컬럼 설정 (데이터 구조)</label>
            </div>

            <div className="schema-list">
                {schema.map((col, index) => (
                    <div key={col.id} className="schema-row-group">
                        <div className="schema-row">
                            <div className="drag-handle">
                                <GripVertical size={16} color="#ccc" />
                            </div>
                            <input
                                type="text"
                                placeholder="컬럼명 (예: 가격, 담당자)"
                                value={col.name}
                                onChange={(e) => updateColumn(col.id, 'name', e.target.value)}
                                className="col-name-input"
                                autoComplete="off"
                            />
                            <select
                                value={col.type}
                                onChange={(e) => updateColumn(col.id, 'type', e.target.value)}
                                className="col-type-select"
                            >
                                {COLUMN_TYPES.map(type => (
                                    <option key={type.id} value={type.id}>
                                        {type.label}
                                    </option>
                                ))}
                            </select>
                            <button
                                className="remove-col-btn"
                                onClick={() => removeColumn(col.id)}
                                type="button"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Formula Builder Extras */}
                        {col.type === 'formula' && (
                            <div className="formula-builder-row">
                                <div className="formula-input-wrapper">
                                    <Calculator size={14} className="formula-icon" />
                                    <input
                                        type="text"
                                        placeholder="예: 가격 * 수량 (텍스트로 입력하면 자동 변환)"
                                        value={col.formula || ''}
                                        onChange={(e) => updateColumn(col.id, 'formula', e.target.value)}
                                        className="formula-input"
                                    />
                                    <button
                                        type="button"
                                        className="magic-formula-btn"
                                        onClick={() => {
                                            let text = col.formula || '';
                                            // Simple Natural Language Parser
                                            schema.forEach(c => {
                                                if (c.id !== col.id && c.name) {
                                                    // Replace column names with ID references {col_id}
                                                    // Sort by length desc to avoid partial matches on similar names
                                                    const regex = new RegExp(c.name, 'gi');
                                                    text = text.replace(regex, `{${c.id}}`);
                                                }
                                            });
                                            updateColumn(col.id, 'formula', text);
                                        }}
                                        title="텍스트를 수식으로 변환 (컬럼명 -> ID)"
                                    >
                                        ⚡ 자동변환
                                    </button>
                                </div>
                                <div className="formula-help">
                                    * 다른 컬럼의 이름을 입력하고 '자동변환'을 누르세요. 산술연산자(+, -, *, /) 사용 가능.
                                </div>
                            </div>
                        )}

                        {/* Select Options Builder (Placeholder for future) */}
                        {col.type === 'select' && (
                            <div className="formula-builder-row">
                                <input
                                    type="text"
                                    placeholder="옵션 (콤마 , 로 구분) 예: 진행중,완료,대기"
                                    value={col.options || ''}
                                    onChange={(e) => updateColumn(col.id, 'options', e.target.value)}
                                    className="formula-input"
                                />
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <button type="button" className="add-col-btn" onClick={addColumn}>
                <Plus size={16} />
                <span>컬럼 추가</span>
            </button>
        </div >
    );
};

export default SchemaBuilder;
