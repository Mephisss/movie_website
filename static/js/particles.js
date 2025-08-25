// Enhanced particle system with performance optimizations
function createParticles() {
    const bgAnimation = document.getElementById('bgAnimation');
    
    if (!bgAnimation) {
        console.warn('Background animation container not found');
        return;
    }

    // Configuration
    const config = {
        particleCount: getOptimalParticleCount(),
        colors: ['#ff6b35', '#ff8c42', '#ffa366', '#ff7a42'],
        minSize: 1,
        maxSize: 3,
        minDuration: 15,
        maxDuration: 25,
        minDelay: 0,
        maxDelay: 20
    };

    let particles = [];
    let animationFrame;
    let isVisible = true;

    // Determine optimal particle count based on device performance
    function getOptimalParticleCount() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        const screenSize = width * height;
        
        // Reduce particles on mobile devices and smaller screens
        if (width < 768) return 20;
        if (screenSize < 1000000) return 30;
        if (screenSize < 2000000) return 50;
        return 75;
    }

    // Check if user prefers reduced motion
    function respectsReducedMotion() {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    // Create individual particle
    function createParticle() {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        // Random properties
        const size = Math.random() * (config.maxSize - config.minSize) + config.minSize;
        const color = config.colors[Math.floor(Math.random() * config.colors.length)];
        const startX = Math.random() * 100;
        const endX = startX + (Math.random() - 0.5) * 30; // Random drift
        const duration = Math.random() * (config.maxDuration - config.minDuration) + config.minDuration;
        const delay = Math.random() * config.maxDelay;
        const opacity = Math.random() * 0.6 + 0.2;
        
        // Apply styles
        Object.assign(particle.style, {
            left: startX + '%',
            width: size + 'px',
            height: size + 'px',
            background: color,
            opacity: opacity,
            animationDuration: duration + 's',
            animationDelay: delay + 's',
            boxShadow: `0 0 ${size * 2}px ${color}40`
        });
        
        // Custom animation with drift
        particle.style.setProperty('--end-x', endX + '%');
        
        return particle;
    }

    // Batch create particles for better performance
    function createParticleBatch() {
        const fragment = document.createDocumentFragment();
        
        for (let i = 0; i < config.particleCount; i++) {
            const particle = createParticle();
            particles.push(particle);
            fragment.appendChild(particle);
        }
        
        bgAnimation.appendChild(fragment);
    }

    // Clean up completed particles and create new ones
    function recycleParticles() {
        particles = particles.filter(particle => {
            if (particle.offsetParent === null || 
                particle.getBoundingClientRect().top < -100) {
                particle.remove();
                return false;
            }
            return true;
        });

        // Add new particles if needed
        while (particles.length < config.particleCount && isVisible) {
            const newParticle = createParticle();
            particles.push(newParticle);
            bgAnimation.appendChild(newParticle);
        }
    }

    // Pause/resume animation based on page visibility
    function handleVisibilityChange() {
        isVisible = !document.hidden;
        
        if (isVisible) {
            // Resume animations
            particles.forEach(particle => {
                particle.style.animationPlayState = 'running';
            });
            startRecycling();
        } else {
            // Pause animations
            particles.forEach(particle => {
                particle.style.animationPlayState = 'paused';
            });
            stopRecycling();
        }
    }

    // Start particle recycling loop
    function startRecycling() {
        function recycleLoop() {
            if (isVisible) {
                recycleParticles();
                animationFrame = requestAnimationFrame(() => {
                    setTimeout(recycleLoop, 2000); // Check every 2 seconds
                });
            }
        }
        recycleLoop();
    }

    // Stop particle recycling
    function stopRecycling() {
        if (animationFrame) {
            cancelAnimationFrame(animationFrame);
            animationFrame = null;
        }
    }

    // Handle window resize
    function handleResize() {
        const newCount = getOptimalParticleCount();
        
        if (newCount !== config.particleCount) {
            config.particleCount = newCount;
            
            // Remove excess particles
            if (particles.length > newCount) {
                const excessParticles = particles.splice(newCount);
                excessParticles.forEach(particle => particle.remove());
            }
        }
    }

    // Initialize particle system
    function init() {
        // Don't create particles if user prefers reduced motion
        if (respectsReducedMotion()) {
            bgAnimation.style.display = 'none';
            return;
        }

        // Clear existing particles
        bgAnimation.innerHTML = '';
        particles = [];

        // Create initial batch
        createParticleBatch();

        // Start recycling
        startRecycling();

        // Add event listeners
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('resize', debounce(handleResize, 500));

        // Reduced motion listener
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        mediaQuery.addListener((e) => {
            if (e.matches) {
                destroy();
            } else {
                init();
            }
        });
    }

    // Destroy particle system
    function destroy() {
        stopRecycling();
        particles.forEach(particle => particle.remove());
        particles = [];
        bgAnimation.innerHTML = '';
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('resize', handleResize);
    }

    // Debounce utility function
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func.apply(this, args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Add custom CSS animation for particle drift
    if (!document.getElementById('particle-styles')) {
        const style = document.createElement('style');
        style.id = 'particle-styles';
        style.textContent = `
            .particle {
                position: absolute;
                border-radius: 50%;
                pointer-events: none;
                will-change: transform, opacity;
                animation: particleFloat 20s infinite linear;
            }
            
            @keyframes particleFloat {
                0% {
                    transform: translateY(100vh) translateX(0px) scale(0);
                    opacity: 0;
                }
                5% {
                    opacity: var(--particle-opacity, 0.8);
                    transform: translateY(95vh) translateX(5px) scale(1);
                }
                95% {
                    opacity: var(--particle-opacity, 0.8);
                    transform: translateY(5vh) translateX(var(--end-x, 50px)) scale(1);
                }
                100% {
                    transform: translateY(-5vh) translateX(var(--end-x, 60px)) scale(0);
                    opacity: 0;
                }
            }
            
            /* Performance optimizations */
            .bg-animation {
                will-change: auto;
                contain: layout style paint;
            }
            
            /* Pause animations when not in viewport */
            .bg-animation:not(.visible) .particle {
                animation-play-state: paused;
            }
        `;
        document.head.appendChild(style);
    }

    // Initialize
    init();

    // Return control functions
    return {
        destroy,
        pause: () => handleVisibilityChange(false),
        resume: () => handleVisibilityChange(true),
        updateCount: (count) => {
            config.particleCount = count;
            handleResize();
        }
    };
}

// Enhanced intersection observer for performance
function createIntersectionObserver() {
    const bgAnimation = document.getElementById('bgAnimation');
    if (!bgAnimation) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            } else {
                entry.target.classList.remove('visible');
            }
        });
    }, {
        threshold: 0,
        rootMargin: '100px'
    });

    observer.observe(bgAnimation);
    return observer;
}

// Initialize particles system when DOM is ready
let particleSystem;
let intersectionObserver;

document.addEventListener('DOMContentLoaded', () => {
    // Small delay to ensure all elements are rendered
    setTimeout(() => {
        particleSystem = createParticles();
        intersectionObserver = createIntersectionObserver();
    }, 100);
});

// Clean up on page unload
window.addEventListener('beforeunload', () => {
    if (particleSystem && typeof particleSystem.destroy === 'function') {
        particleSystem.destroy();
    }
    if (intersectionObserver) {
        intersectionObserver.disconnect();
    }
});