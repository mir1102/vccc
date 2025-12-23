import React from 'react';
import { format } from 'date-fns';
import { CheckCircle, Circle, Clock, FileText, TrendingUp } from 'lucide-react';

const DailySummary = ({ date, items = [], memo }) => {
    // Separate items
    const events = items.filter(item => item.type === 'event');
    const todos = items.filter(item => item.type === 'todo');

    // Calculate stats
    const totalTodos = todos.length;
    const completedTodos = todos.filter(t => t.isCompleted).length;
    const completionRate = totalTodos > 0 ? Math.round((completedTodos / totalTodos) * 100) : 0;

    return (
        <div className="daily-summary" style={{ padding: '0 5px' }}>
            <div id="daily-summary-content">
                {/* Header Stats */}
                <div className="summary-stats" style={{
                    display: 'flex',
                    gap: '15px',
                    marginBottom: '20px',
                    padding: '15px',
                    background: 'var(--card-bg)',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)'
                }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>할 일 달성률</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '5px' }}>
                            <TrendingUp size={20} color="#10b981" />
                            <span style={{ fontSize: '24px', fontWeight: 'bold' }}>{completionRate}%</span>
                        </div>
                    </div>
                    <div style={{ width: '1px', background: 'var(--border-color)' }}></div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>완료 / 전체</span>
                        <span style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '5px' }}>
                            {completedTodos} <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>/ {totalTodos}</span>
                        </span>
                    </div>
                </div>

                {/* Content Lists */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    {/* Events Section */}
                    {events.length > 0 && (
                        <div>
                            <h4 style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                                <Clock size={14} /> 오늘의 일정
                            </h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {events.map((event, i) => (
                                    <div key={i} style={{
                                        padding: '8px 12px',
                                        background: 'rgba(59, 130, 246, 0.1)',
                                        borderLeft: '3px solid #3b82f6',
                                        borderRadius: '4px',
                                        fontSize: '14px'
                                    }}>
                                        {event.content}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* To-Dos Section */}
                    <div>
                        <h4 style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                            <CheckCircle size={14} /> 할 일 체크리스트
                        </h4>
                        {todos.length === 0 ? (
                            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px', background: 'var(--bg-color)', borderRadius: '8px' }}>
                                등록된 할 일이 없습니다.
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {todos.map((todo, i) => (
                                    <div key={i} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        padding: '8px',
                                        background: 'var(--bg-color)',
                                        borderRadius: '6px'
                                    }}>
                                        {todo.isCompleted ?
                                            <CheckCircle size={18} color="#10b981" /> :
                                            <Circle size={18} color="var(--text-secondary)" />
                                        }
                                        <span style={{
                                            textDecoration: todo.isCompleted ? 'line-through' : 'none',
                                            color: todo.isCompleted ? 'var(--text-secondary)' : 'var(--text-color)',
                                            flex: 1
                                        }}>
                                            {todo.content}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Memo Section */}
                    {memo && (
                        <div>
                            <h4 style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                                <FileText size={14} /> 오늘의 메모
                            </h4>
                            <div style={{
                                padding: '12px',
                                background: '#fef3c7',
                                color: '#92400e',
                                borderRadius: '8px',
                                lineHeight: '1.5',
                                fontSize: '14px'
                            }}>
                                {memo.image && (
                                    <img src={memo.image} alt="Memo" style={{ maxWidth: '100%', borderRadius: '4px', marginBottom: '10px', display: 'block' }} />
                                )}
                                <div style={{ whiteSpace: 'pre-wrap' }}>{memo.content || '내용 없음'}</div>
                                {memo.link && (
                                    <a href={memo.link} target="_blank" rel="noopener noreferrer" style={{ display: 'block', marginTop: '8px', color: '#b45309', textDecoration: 'underline', fontSize: '12px' }}>
                                        🔗 {memo.link}
                                    </a>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
            {/* Footer Actions */}
            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                    onClick={() => {
                        const printContent = document.getElementById('daily-summary-content').innerHTML;
                        const printWindow = window.open('', '', 'width=800,height=600');
                        printWindow.document.write(`
                            <html>
                                <head>
                                    <title>일일 요약 - ${format(date, 'yyyy-MM-dd')}</title>
                                    <style>
                                        body { font-family: sans-serif; padding: 20px; }
                                        .summary-stats { display: flex; gap: 20px; margin-bottom: 20px; border: 1px solid #ccc; padding: 15px; border-radius: 8px; }
                                        h4 { margin-top: 20px; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
                                        .event-item { padding: 8px; background: #f0f9ff; margin-bottom: 5px; border-left: 3px solid #3b82f6; }
                                        .todo-item { display: flex; align-items: center; gap: 10px; padding: 5px 0; }
                                        .memo-box { background: #fffbeb; padding: 15px; border-radius: 8px; color: #92400e; margin-top: 10px; white-space: pre-wrap; }
                                        img { max-width: 100%; border-radius: 4px; }
                                    </style>
                                </head>
                                <body>
                                    <h2>📅 ${format(date, 'yyyy년 M월 d일')} 요약</h2>
                                    ${printContent}
                                </body>
                            </html>
                        `);
                        printWindow.document.close();
                        printWindow.focus();
                        printWindow.print();
                        printWindow.close();
                    }}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-color)',
                        background: 'white',
                        cursor: 'pointer'
                    }}
                >
                    🖨️ 인쇄하기
                </button>
            </div>
        </div>
    );
};

export default DailySummary;
