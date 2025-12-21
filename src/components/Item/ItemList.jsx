import React from 'react';
import { Check, Trash2, Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';
import './ItemList.css';

const ItemList = ({ items, viewMode, onItemToggle, onItemDelete }) => {

    if (items.length === 0) {
        return <div className="no-items">등록된 내용이 없습니다.</div>;
    }

    return (
        <div className={`items-container ${viewMode}`}>
            {items.map(item => (
                <div key={item.id} className={`item-card ${item.isCompleted ? 'completed' : ''}`}>
                    <div className="item-content">
                        <div className="item-header">
                            <span className="item-text">{item.content}</span>
                        </div>
                        {item.date && (
                            <div className="item-meta">
                                <span className="meta-tag date">
                                    <Calendar size={12} />
                                    {format(new Date(item.date), 'MM.dd')}
                                </span>
                                {item.time && (
                                    <span className="meta-tag time">
                                        <Clock size={12} />
                                        {item.time}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="item-actions">
                        <button
                            className={`action-btn check ${item.isCompleted ? 'active' : ''}`}
                            onClick={(e) => { e.stopPropagation(); onItemToggle(item.id, !item.isCompleted); }}
                        >
                            <Check size={16} />
                        </button>
                        <button
                            className="action-btn delete"
                            onClick={(e) => { e.stopPropagation(); onItemDelete(item.id); }}
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ItemList;
