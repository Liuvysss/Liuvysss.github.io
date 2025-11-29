document.addEventListener("DOMContentLoaded", function () {
    // Current simple logic for Coming Soon page
    // (Most effects are now handled via CSS animations for better performance)

    console.log("Liuvys Portfolio - Coming Soon 2026");

    // Optional: Add simple hover tilt to the card if desired
    const card = document.querySelector('.cs-card');

    if (card && window.innerWidth > 768) {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // Very subtle movement
            const xPct = (x / rect.width) - 0.5;
            const yPct = (y / rect.height) - 0.5;

            card.style.transform = `perspective(1000px) rotateY(${xPct * 2}deg) rotateX(${yPct * -2}deg)`;
            card.style.transition = 'none';
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateY(0) rotateX(0)';
            card.style.transition = 'transform 0.5s ease';
        });
    }
});