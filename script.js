// Header Shrink on Scroll & Scroll Progress Logic
window.addEventListener('scroll', function () {
    const header = document.getElementById('main-header');

    // 1. Header Shrink
    if (window.scrollY > 50) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }

    // 2. Top Scroll Progress Bar
    const progressBar = document.getElementById('scroll-progress-bar');
    if (progressBar) {
        const scrollTop = window.scrollY;
        const docHeight = document.body.scrollHeight - window.innerHeight;
        const scrollPercent = (scrollTop / docHeight) * 100;
        progressBar.style.width = scrollPercent + '%';
    }

    // 3. Back To Top Button & Circular Progress
    const backToTopBtn = document.getElementById('back-to-top');
    if (backToTopBtn) {
        const scrollTop = window.scrollY;
        const docHeight = document.body.scrollHeight - window.innerHeight;
        const scrollPercent = (scrollTop / docHeight); // 0 to 1

        // Show button after scrolling past Hero (approx 500px)
        if (scrollTop > 500) {
            backToTopBtn.classList.add('visible');
        } else {
            backToTopBtn.classList.remove('visible');
        }

        // Update Circular SVG Stroke
        // Path length is approx 308 (2 * PI * 49)
        const path = backToTopBtn.querySelector('path');
        const pathLength = 308;
        const offset = pathLength - (pathLength * scrollPercent);
        path.style.strokeDashoffset = offset;
    }
});

// Main Initialization
document.addEventListener("DOMContentLoaded", function () {

    // --- FEATURE: TYPING ANIMATION ---
    const typingElement = document.getElementById('typing-text');
    if (typingElement) {
        const roles = ["Web Designer", "Frontend Developer", "Digital Creator"];
        let roleIndex = 0;
        let charIndex = 0;
        let isDeleting = false;
        let typeSpeed = 100;

        function typeText() {
            const currentRole = roles[roleIndex];

            if (isDeleting) {
                // Remove characters
                typingElement.innerText = currentRole.substring(0, charIndex - 1);
                charIndex--;
                typeSpeed = 50; // Faster deleting
            } else {
                // Add characters
                typingElement.innerText = currentRole.substring(0, charIndex + 1);
                charIndex++;
                typeSpeed = 150; // Normal typing
            }

            if (!isDeleting && charIndex === currentRole.length) {
                // Finished typing word, pause then delete
                isDeleting = true;
                typeSpeed = 2000; // Pause at end
            } else if (isDeleting && charIndex === 0) {
                // Finished deleting, move to next word
                isDeleting = false;
                roleIndex = (roleIndex + 1) % roles.length;
                typeSpeed = 500; // Pause before starting new word
            }

            setTimeout(typeText, typeSpeed);
        }

        // Start typing
        typeText();
    }


    // --- FEATURE: 3D TILT EFFECT ---
    const tiltCards = document.querySelectorAll('.tilt-card');

    tiltCards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const width = rect.width;
            const height = rect.height;

            // Calculate mouse position relative to card center
            // 0.5 is center, < 0.5 is left/top, > 0.5 is right/bottom
            const mouseX = (e.clientX - rect.left) / width;
            const mouseY = (e.clientY - rect.top) / height;

            // Rotation amounts (max 15 degrees)
            const rotateY = (mouseX - 0.5) * 30; // Tilt L/R
            const rotateX = (mouseY - 0.5) * -30; // Tilt Up/Down (inverted)

            // Apply transform. 
            // set transition to none for smooth tracking, then re-enable on mouseleave
            card.style.transition = 'transform 0.1s ease';
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transition = 'transform 0.5s ease';
            card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
        });
    });


    // --- FEATURE: BACK TO TOP CLICK ---
    const backToTopBtn = document.getElementById('back-to-top');
    if (backToTopBtn) {
        backToTopBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }


    // --- FEATURE: FOOTER EASTER EGG ---
    const footerLogo = document.getElementById('footer-logo');
    if (footerLogo) {
        footerLogo.addEventListener('click', function (e) {
            e.preventDefault(); // Prevent jump to top from '#' link
            this.classList.add('spin-animation');

            // Remove class after animation completes so it can be clicked again
            setTimeout(() => {
                this.classList.remove('spin-animation');
            }, 600); // Matches CSS animation duration
        });
    }


    // --- FEATURE: MOBILE MENU TOGGLE ---
    const mobileMenuBtn = document.getElementById('mobile-menu-toggle');
    const mobileMenuSidebar = document.getElementById('mobile-menu-sidebar');
    const mobileMenuOverlay = document.getElementById('mobile-menu-overlay');
    const closeMenuBtn = document.getElementById('close-menu-btn');
    const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');

    function toggleMenu() {
        if (mobileMenuSidebar && mobileMenuOverlay) {
            mobileMenuSidebar.classList.toggle('active');
            mobileMenuOverlay.classList.toggle('active');
        }
    }

    function closeMenu() {
        if (mobileMenuSidebar && mobileMenuOverlay) {
            mobileMenuSidebar.classList.remove('active');
            mobileMenuOverlay.classList.remove('active');
        }
    }

    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', toggleMenu);
    }

    if (closeMenuBtn) {
        closeMenuBtn.addEventListener('click', closeMenu);
    }

    if (mobileMenuOverlay) {
        mobileMenuOverlay.addEventListener('click', closeMenu);
    }

    // Close menu when a link is clicked
    mobileNavLinks.forEach(link => {
        link.addEventListener('click', closeMenu);
    });


    // --- EXISTING INTERSECTION OBSERVER LOGIC ---

    // 1. Scroll Animations (Fade Ins)
    const animationObserverOptions = {
        root: null,
        rootMargin: "0px",
        threshold: 0.1
    };

    const animationObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');
            }
        });
    }, animationObserverOptions);

    document.querySelectorAll('.animate-on-scroll').forEach(element => {
        animationObserver.observe(element);
    });

    // 2. Active Navbar State on Scroll
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-list li a');

    const scrollSpyOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.3
    };

    const scrollSpyObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const currentId = entry.target.getAttribute('id');

                navLinks.forEach(link => {
                    if (link.getAttribute('href') === `#${currentId}`) {
                        link.classList.add('active');
                    } else {
                        if (link.getAttribute('href').startsWith('#')) {
                            link.classList.remove('active');
                        }
                    }
                });
            }
        });
    }, scrollSpyOptions);

    sections.forEach(section => {
        scrollSpyObserver.observe(section);
    });

    // 3. Contact Form Handling
    const contactForm = document.getElementById('contactForm');
    const formSuccess = document.getElementById('formSuccess');

    if (contactForm) {
        contactForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const name = document.getElementById('fullName').value.trim();
            const email = document.getElementById('email').value.trim();
            const message = document.getElementById('message').value.trim();

            if (name && email && message) {
                contactForm.style.display = 'none';
                formSuccess.classList.remove('hidden');
                contactForm.reset();
            }
        });
    }
});