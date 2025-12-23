import React, { useEffect, useRef } from 'react';
import './ContextMenu.css';

const ContextMenu = ({ x, y, onClose, actions }) => {
    const menuRef = useRef(null);
    const [position, setPosition] = React.useState({ top: y, left: x, opacity: 0 });

    React.useLayoutEffect(() => {
        if (menuRef.current) {
            const rect = menuRef.current.getBoundingClientRect();
            let newTop = y;
            let newLeft = x;

            // Vertical adjustments
            if (y + rect.height > window.innerHeight) {
                // If it overflows bottom, flip upwards
                newTop = y - rect.height;
                // If flipping up goes off-screen top, clamp to 0 or center
                if (newTop < 0) {
                    // If too tall for screen, align to bottom or scroll? 
                    // Simple clamp:
                    newTop = window.innerHeight - rect.height - 10;
                }
            }

            // Horizontal adjustments
            if (x + rect.width > window.innerWidth) {
                newLeft = x - rect.width;
                if (newLeft < 0) newLeft = 10;
            }

            setPosition({ top: newTop, left: newLeft, opacity: 1 });
        }
    }, [x, y]);

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

    // Apply calculated position
    const style = {
        top: position.top,
        left: position.left,
        opacity: position.opacity, // Prevent flash
        pointerEvents: position.opacity === 0 ? 'none' : 'auto', // Prevent clicks while hidden
        position: 'fixed', // Ensure it's relative to viewport for correct logic
        zIndex: 1000
    };

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
