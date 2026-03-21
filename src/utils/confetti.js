export function fireConfetti() {
    const colors = ['#f97316', '#3b82f6', '#eab308', '#ec4899', '#10b981'];
    const count = 120;
    const particles = [];
    
    const canvas = document.createElement('canvas');
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '9999';
    document.body.appendChild(canvas);
    
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    for(let i=0; i<count; i++) {
        particles.push({
            x: canvas.width / 2, // start from center-ish
            y: canvas.height / 2 + 50,
            r: Math.random() * 5 + 3, // size
            dx: Math.random() * 30 - 15, // horizontal spread
            dy: Math.random() * -20 - 10, // vertical explosion
            color: colors[Math.floor(Math.random() * colors.length)],
            tilt: Math.floor(Math.random() * 10) - 10,
            tiltAngleInc: (Math.random() * 0.07) + 0.05,
            tiltAngle: 0
        });
    }

    function render() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let active = false;
        
        particles.forEach(p => {
            p.tiltAngle += p.tiltAngleInc;
            p.y += (Math.cos(p.tiltAngle) + 1 + p.r / 2) / 2;
            p.x += Math.sin(p.tiltAngle) * 2 + p.dx;
            p.dy += 0.5; // gravity
            p.dx *= 0.95; // air resistance
            p.y += p.dy;
            
            if (p.y <= canvas.height) active = true;
            
            ctx.beginPath();
            ctx.lineWidth = p.r;
            ctx.strokeStyle = p.color;
            ctx.moveTo(p.x + p.tilt + p.r, p.y);
            ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r);
            ctx.stroke();
        });
        
        if (active) {
            requestAnimationFrame(render);
        } else {
            canvas.remove();
        }
    }
    
    render();
}
