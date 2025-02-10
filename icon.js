// Function to create canvas and draw icon
function createIcon(size, disabled = false) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Set colors based on state
    const colors = disabled ? {
        background: '#cccccc',
        text: '#666666',
        border: '#999999'
    } : {
        background: '#4285f4',
        text: '#ffffff',
        border: '#2965cc'
    };

    // Draw background
    ctx.fillStyle = colors.background;
    ctx.beginPath();
    ctx.arc(size/2, size/2, size/2 - 1, 0, Math.PI * 2);
    ctx.fill();

    // Draw border
    ctx.strokeStyle = colors.border;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Draw "LF" text
    ctx.fillStyle = colors.text;
    ctx.font = `bold ${size/2}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('LF', size/2, size/2);

    return canvas;
}

// Create icons and save them
function generateIcons() {
    const sizes = [16, 48, 128];
    const states = [false, true]; // false = enabled, true = disabled

    sizes.forEach(size => {
        states.forEach(disabled => {
            const canvas = createIcon(size, disabled);
            const link = document.createElement('a');
            link.download = `icon${size}${disabled ? '-disabled' : ''}.png`;
            link.href = canvas.toDataURL('image/png');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    });
}

// Generate icons when the page loads
window.onload = generateIcons;
