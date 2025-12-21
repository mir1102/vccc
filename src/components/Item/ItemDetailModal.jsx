import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';

const ItemDetailModal = ({ item, schema, onClose }) => {
    if (!item) return null;

    // Helper to format values similar to ReadOnly view
    const renderValue = (col, value) => {
        if (!value && col.type !== 'checkbox') return <span style={{ color: '#9ca3af' }}>-</span>;

        switch (col.type) {
            case 'date':
                try {
                    const cleanValue = String(value).replace(/[년월일]/g, '').trim();
                    const dateObj = new Date(cleanValue);
                    return isNaN(dateObj.getTime()) ? value : format(dateObj, 'yyyy-MM-dd');
                } catch { return value; }
            case 'checkbox':
                return value ? "✅ Yes" : "⬜ No";
            case 'rating':
                return "⭐".repeat(Number(value) || 0);
            case 'file':
                // Special handling in main render
                return null;
            case 'link':
                return (
                    <a href={value} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#2563eb', textDecoration: 'underline' }}>
                        {value} <ExternalLink size={12} />
                    </a>
                );
            default:
                return <span className="notranslate" style={{ whiteSpace: 'pre-wrap' }}>{value}</span>;
        }
    };

    // Improved image detection for Firebase Storage URLs
    const isImage = (f) => {
        if (typeof f !== 'string') return false;
        return f.startsWith('data:image') ||
            f.includes('firebasestorage') ||
            /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(f);
    };

    return (
        <div
            onClick={onClose}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                backdropFilter: 'blur(2px)',
                zIndex: 9999, // Extremely high z-index
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'default'
            }}
        >
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    width: '90%',
                    maxWidth: '700px',
                    maxHeight: '90vh',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    position: 'relative' // For absolute positioning inside
                }}
            >
                {/* Header */}
                <div style={{
                    padding: '16px 20px',
                    borderBottom: '1px solid #e5e7eb',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: '#f9fafb'
                }}>
                    <h2 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>상세 정보</h2>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '8px',
                            border: 'none',
                            background: 'transparent',
                            cursor: 'pointer',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#6b7280'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Body */}
                <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>

                    {/* 1. Image Gallery Section */}
                    {schema.filter(col => col.type === 'file').map(col => {
                        const val = item.customValues?.[col.id];
                        const fileList = Array.isArray(val) ? val : (val ? [val] : []);
                        const images = fileList.filter(isImage);

                        if (images.length === 0) return null;

                        return (
                            <div key={col.id} style={{ marginBottom: '24px' }}>
                                <h3 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#6b7280', marginBottom: '8px' }}>{col.name}</h3>
                                <ImageGallery images={images} />
                            </div>
                        );
                    })}

                    {/* 2. Other Fields Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                        {schema.filter(col => col.type !== 'file').map(col => (
                            <div key={col.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{col.name}</label>
                                <div style={{
                                    padding: '12px',
                                    backgroundColor: '#f9fafb',
                                    borderRadius: '8px',
                                    border: '1px solid #f3f4f6',
                                    minHeight: '44px',
                                    fontSize: '0.925rem',
                                    color: '#374151',
                                    display: 'flex',
                                    alignItems: 'center'
                                }}>
                                    {renderValue(col, item.customValues?.[col.id])}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* 3. Non-Image Files */}
                    {schema.filter(col => col.type === 'file').map(col => {
                        const val = item.customValues?.[col.id];
                        const fileList = Array.isArray(val) ? val : (val ? [val] : []);
                        const docs = fileList.filter(f => !isImage(f));

                        if (docs.length === 0) return null;

                        return (
                            <div key={`${col.id}-docs`} style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
                                <h3 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#6b7280', marginBottom: '8px' }}>{col.name} (문서)</h3>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {docs.map((doc, idx) => (
                                        <div key={idx} style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            padding: '8px 12px',
                                            backgroundColor: '#f3f4f6',
                                            borderRadius: '6px',
                                            fontSize: '0.875rem',
                                            color: '#4b5563'
                                        }}>
                                            <span>📄</span>
                                            <span style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{doc}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

// Sub-component for Carousel
const ImageGallery = ({ images }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    if (!images || images.length === 0) return null;

    const next = (e) => {
        e.stopPropagation();
        setCurrentIndex((prev) => (prev + 1) % images.length);
    };

    const prev = (e) => {
        e.stopPropagation();
        setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    return (
        <div style={{
            position: 'relative',
            borderRadius: '12px',
            overflow: 'hidden',
            border: '1px solid #e5e7eb',
            backgroundColor: '#0000000d'
        }}>
            {/* Main Image Container */}
            <div style={{
                aspectRatio: '16/9',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#f3f4f6'
            }}>
                <img
                    src={images[currentIndex]}
                    alt={`Gallery ${currentIndex + 1}`}
                    style={{
                        maxHeight: '100%',
                        maxWidth: '100%',
                        objectFit: 'contain'
                    }}
                />
            </div>

            {/* Navigation Overlay */}
            {images.length > 1 && (
                <>
                    <button
                        onClick={prev}
                        style={{
                            position: 'absolute',
                            left: '8px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            padding: '8px',
                            backgroundColor: 'rgba(0,0,0,0.5)',
                            color: 'white',
                            borderRadius: '50%',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <button
                        onClick={next}
                        style={{
                            position: 'absolute',
                            right: '8px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            padding: '8px',
                            backgroundColor: 'rgba(0,0,0,0.5)',
                            color: 'white',
                            borderRadius: '50%',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <ChevronRight size={24} />
                    </button>

                    {/* Dots Indicator */}
                    <div style={{
                        position: 'absolute',
                        bottom: '12px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        display: 'flex',
                        gap: '6px',
                        backgroundColor: 'rgba(0,0,0,0.3)',
                        padding: '4px 8px',
                        borderRadius: '20px',
                        backdropFilter: 'blur(2px)'
                    }}>
                        {images.map((_, idx) => (
                            <div
                                key={idx}
                                style={{
                                    width: idx === currentIndex ? '16px' : '8px',
                                    height: '8px',
                                    borderRadius: '4px',
                                    backgroundColor: idx === currentIndex ? 'white' : 'rgba(255,255,255,0.5)',
                                    transition: 'all 0.3s'
                                }}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default ItemDetailModal;
