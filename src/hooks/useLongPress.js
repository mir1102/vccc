import { useState, useRef, useCallback } from 'react';

const useLongPress = (onLongPress, onClick, { shouldPreventDefault = true, delay = 500 } = {}) => {
    const [longPressTriggered, setLongPressTriggered] = useState(false);
    const timeout = useRef();
    const targetRef = useRef();

    const start = useCallback(
        (event) => {
            // Ignore right click (button 2) or other non-primary buttons for mouse events
            if (event.type === 'mousedown' && event.button !== 0) return;

            if (shouldPreventDefault && event.target) {
                event.target.addEventListener('touchend', preventDefault, { passive: false });
                targetRef.current = event.target;
            }
            timeout.current = setTimeout(() => {
                onLongPress(event);
                setLongPressTriggered(true);
            }, delay);
        },
        [onLongPress, delay, shouldPreventDefault]
    );

    const clear = useCallback(
        (event, shouldTriggerClick = true) => {
            timeout.current && clearTimeout(timeout.current);

            // Ignore click trigger for right clicks (button !== 0)
            const isRightClick = event.type === 'mouseup' && event.button !== 0;

            if (shouldTriggerClick && !longPressTriggered && onClick && !isRightClick) {
                onClick(event);
            }
            setLongPressTriggered(false);
            if (shouldPreventDefault && targetRef.current) {
                targetRef.current.removeEventListener('touchend', preventDefault);
            }
        },
        [shouldPreventDefault, onClick, longPressTriggered]
    );

    return {
        onMouseDown: (e) => start(e),
        onTouchStart: (e) => start(e),
        onMouseUp: (e) => clear(e),
        onMouseLeave: (e) => clear(e, false),
        onTouchEnd: (e) => clear(e)
    };
};

const preventDefault = (e) => {
    if (!isTouchEvent(e)) return;
    if (e.touches.length < 2 && e.preventDefault) {
        e.preventDefault();
    }
};

const isTouchEvent = (e) => {
    return e && 'touches' in e;
};

export default useLongPress;
