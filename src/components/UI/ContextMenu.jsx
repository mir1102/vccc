import React, { useEffect, useRef } from 'react';
import './ContextMenu.css';

const ContextMenu = ({ x, y, onClose, actions }) => {
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                onClose();
            }
        };

        const handleScroll = () => {
            onClose();
        };

        document.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('scroll', handleScroll, true); // Close on scroll
        window.addEventListener('resize', handleScroll);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', handleScroll, true);
            window.removeEventListener('resize', handleScroll);
        };
    }, [onClose]);

    // Prevent menu from going off-screen
    const style = {
        top: y,
        left: x,
    };

    // Simple adjustment if close to right edge (can be improved with measuring ref)
    if (window.innerWidth - x < 150) {
        style.left = 'auto';
        style.right = window.innerWidth - x;
    }

    return (
        <div
            className="context-menu"
            style={style}
            ref={menuRef}
            onClick={(e) => e.stopPropagation()} // Prevent clicks inside from closing immediately if not desired, though usually we want action click to close.
        >
            {actions.map((action, index) => (
                <button
                    key={index}
                    className={`context-menu-item ${action.danger ? 'danger' : ''}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        action.onClick();
                        onClose();
                    }}
                >
                    {action.icon && <span className="menu-icon">{action.icon}</span>}
                    {action.label}
                </button>
            ))}
        </div>
    );
};

export default ContextMenu;
