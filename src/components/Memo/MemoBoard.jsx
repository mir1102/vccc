import React, { useRef } from 'react';
import { Plus } from 'lucide-react';
import StickyNote from './StickyNote';

const MemoBoard = ({
    memos = [],
    onAddMemo,
    onUpdateMemo,
    onDeleteMemo
}) => {
    const containerRef = useRef(null);

    const handleAdd = () => {
        // Add new note near center with slight random offset
        const x = 50 + Math.random() * 20;
        const y = 50 + Math.random() * 20;
        const colors = ['#fef3c7', '#dcfce7', '#dbeafe', '#fae8ff', '#ffe4e6'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];

        onAddMemo({
            x, y,
            color: randomColor,
            content: '',
            rotation: (Math.random() * 6) - 3
        });
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Toolbar */}
            <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                padding: '10px',
                borderBottom: '1px solid var(--border-color)',
                background: 'var(--card-bg)'
            }}>
                <button
                    onClick={handleAdd}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '5px',
                        padding: '8px 16px',
                        background: 'var(--primary-color)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '20px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                >
                    <Plus size={16} /> 새 메모
                </button>
            </div>

            {/* Canvas Area */}
            <div
                ref={containerRef}
                style={{
                    flex: 1,
                    position: 'relative',
                    background: 'transparent', // Allow background of parent to show
                    overflow: 'visible', // CRITICAL for global dragging
                    borderRadius: '0 0 12px 12px'
                }}
            >
                {memos.length === 0 && (
                    <div style={{
                        position: 'absolute',
                        top: '50%', left: '50%',
                        transform: 'translate(-50%, -50%)',
                        color: '#94a3b8',
                        pointerEvents: 'none'
                    }}>
                        + 버튼을 눌러 메모를 붙여보세요
                    </div>
                )}

                {memos.map(memo => (
                    <StickyNote
                        key={memo.id}
                        item={memo}
                        onUpdate={onUpdateMemo}
                        onDelete={onDeleteMemo}
                        containerRef={containerRef}
                    />
                ))}
            </div>
        </div>
    );
};

export default MemoBoard;
