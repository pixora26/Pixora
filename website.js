document.addEventListener('DOMContentLoaded', () => {

    // Mobile Menu Toggle
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    mobileMenuButton.addEventListener('click', () => {
        mobileMenu.classList.toggle('hidden');
    });

    // WhatsApp Form Integration
    const contactForm = document.getElementById('contactForm');
    const whatsappButton = document.getElementById('whatsapp-button');
    const messageModal = document.getElementById('message-modal');
    const modalCloseButton = document.getElementById('modal-close-button');

    whatsappButton.addEventListener('click', (e) => {
        e.preventDefault();

        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const bundle = document.getElementById('bundle').value;
        const subject = document.getElementById('subject').value;
        const message = document.getElementById('message').value;

        if (!name || !email || !subject || !message || bundle === 'None') {
            messageModal.classList.remove('hidden');
            return;
        }

        const whatsappMessage = `Hello Pixora! I have a new project inquiry.\n\n` +
                                `*Name:* ${name}\n` +
                                `*Email:* ${email}\n` +
                                `*Interested Bundle:* ${bundle}\n` +
                                `*Subject:* ${subject}\n\n` +
                                `*Message:*\n${message}`;

        const encodedMessage = encodeURIComponent(whatsappMessage);
        const phoneNumber = '+916238874315'; // <-- REPLACE PHONE NUMBER
        const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
        window.open(whatsappUrl, '_blank');
    });

    modalCloseButton.addEventListener('click', () => {
        messageModal.classList.add('hidden');
    });

    // Intersection Observer for fade-in animations
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.2
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.fade-in-section').forEach(element => {
        observer.observe(element);
    });

    // New: Intersection Observer for active nav links
    const sections = document.querySelectorAll('.section');
    const navLinks = document.querySelectorAll('.nav-link');
    const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');

    const setActiveLink = (id) => {
        navLinks.forEach(link => {
            link.classList.remove('active-link');
            link.classList.add('text-gray-600');
        });
        mobileNavLinks.forEach(link => {
            link.classList.remove('active-link');
            link.classList.add('text-gray-600');
        });

        const desktopLink = document.querySelector(`.nav-link[href="#${id}"]`);
        if (desktopLink) {
            desktopLink.classList.add('active-link');
            desktopLink.classList.remove('text-gray-600');
        }
        const mobileLink = document.querySelector(`.mobile-nav-link[href="#${id}"]`);
        if (mobileLink) {
            mobileLink.classList.add('active-link');
            mobileLink.classList.remove('text-gray-600');
        }
    };

    const sectionObserverOptions = {
        root: null,
        rootMargin: '-50% 0px -50% 0px', // When the middle of the viewport hits the section
        threshold: 0
    };

    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                setActiveLink(entry.target.id);
            }
        });
    }, sectionObserverOptions);

    sections.forEach(section => {
        sectionObserver.observe(section);
    });
    // Initial active link for home section
    const homeLink = document.querySelector(`.nav-link[href="#home"]`);
    if (homeLink) {
        homeLink.classList.add('active-link');
        homeLink.classList.remove('text-gray-600');
    }


    // Gemini API Integration for Creative Ideas
    const generateIdeaBtn = document.getElementById('generateIdeaBtn');
    const ideaInput = document.getElementById('ideaInput');
    const ideaOutput = document.getElementById('ideaOutput');
    const ideaText = document.getElementById('ideaText');
    const loadingIndicator = document.getElementById('loadingIndicator');

    generateIdeaBtn.addEventListener('click', async () => {
        const userQuery = ideaInput.value.trim();
        if (!userQuery) {
            // Simple message to the user, not an intrusive alert
            ideaText.textContent = "Please enter a description to generate an idea.";
            ideaOutput.classList.remove('hidden');
            return;
        }

        loadingIndicator.classList.remove('hidden');
        ideaOutput.classList.add('hidden');

        const systemPrompt = `You are a world-class creative director at a digital agency. Your task is to take a vague idea or business description from a potential client and generate a highly creative, actionable, and visually compelling project brief. The brief should include:

1.  A catchy, memorable project name.
2.  A one-paragraph summary of the project's purpose and a key problem it solves.
3.  A clear description of 3 key deliverables (e.g., website, video series, social media campaign, brand identity).
4.  A short description of the unique style or aesthetic.
5.  All outputs should be formatted clearly and engagingly. Do not use markdown. Use a conversational tone and introduce the brief with a phrase like "Here's a creative brief for you:"`;

        const payload = {
            contents: [{ parts: [{ text: userQuery }] }],
            systemInstruction: { parts: [{ text: systemPrompt }] },
            model: "gemini-2.5-flash-preview-05-20"
        };

        const apiKey = "AIzaSyCoPDLGcMeMIwzGEMGFq39Mrh0aCHQSXBE";
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

        try {
            let response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            // Exponential backoff retry logic
            let retryCount = 0;
            const maxRetries = 3;
            const baseDelay = 1000;

            while (!response.ok && response.status === 429 && retryCount < maxRetries) {
                retryCount++;
                const delay = baseDelay * (2 ** retryCount);
                await new Promise(resolve => setTimeout(resolve, delay));
                response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            }

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorData.error.message}`);
            }

            const result = await response.json();
            const generatedText = result?.candidates?.[0]?.content?.parts?.[0]?.text;

            if (generatedText) {
                ideaText.textContent = generatedText;
            } else {
                ideaText.textContent = "I'm sorry, I couldn't generate an idea at this time. Please try a different description or try again later.";
            }
        } catch (error) {
            console.error('Error calling Gemini API:', error);
            ideaText.textContent = "An error occurred while generating your idea. Please check the console for details and try again.";
        } finally {
            loadingIndicator.classList.add('hidden');
            ideaOutput.classList.remove('hidden');
        }
    });

    // About Us Slider Logic
    const slidesWrapper = document.getElementById('slides-wrapper');
    const aboutSliderContainer = document.getElementById('about-slider-container');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const dotsContainer = document.getElementById('slider-dots');
    const dots = dotsContainer.querySelectorAll('.dot');
    let currentSlide = 0;
    let slideInterval;

    const showSlide = (index) => {
        slidesWrapper.style.transform = `translateX(-${index * 100}%)`;
        dots.forEach((dot, i) => {
            if (i === index) {
                dot.classList.remove('bg-gray-300');
                dot.classList.add('bg-indigo-600');
            } else {
                dot.classList.remove('bg-indigo-600');
                dot.classList.add('bg-gray-300');
            }
        });
    };

    const startAutoSlide = () => {
        // Set interval to automatically advance slides every 5 seconds
        slideInterval = setInterval(() => {
            currentSlide = (currentSlide + 1) % dots.length;
            showSlide(currentSlide);
        }, 5000); // 5000 milliseconds = 5 seconds
    };

    const stopAutoSlide = () => {
        clearInterval(slideInterval);
    };

    // Start the automatic sliding
    startAutoSlide();

    // Pause on hover
    aboutSliderContainer.addEventListener('mouseenter', stopAutoSlide);
    aboutSliderContainer.addEventListener('mouseleave', startAutoSlide);

    // Manual controls
    prevBtn.addEventListener('click', () => {
        stopAutoSlide(); // Pause on manual click
        currentSlide = (currentSlide - 1 + dots.length) % dots.length;
        showSlide(currentSlide);
        startAutoSlide(); // Resume after manual click
    });

    nextBtn.addEventListener('click', () => {
        stopAutoSlide(); // Pause on manual click
        currentSlide = (currentSlide + 1) % dots.length;
        showSlide(currentSlide);
        startAutoSlide(); // Resume after manual click
    });

    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            stopAutoSlide(); // Pause on manual click
            currentSlide = index;
            showSlide(currentSlide);
            startAutoSlide(); // Resume after manual click
        });
    });

});


function openModal(title, category, description, mediaSource, mediaType) {
    const modal = document.getElementById('workModal');
    const mediaContainer = document.getElementById('modalMediaContainer');

    // 1. Set text content
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalCategory').textContent = category;
    document.getElementById('modalDescription').textContent = description;

    // 2. Clear previous media and insert new media
    mediaContainer.innerHTML = '';
    
    if (mediaType === 'image') {
        const img = document.createElement('img');
        img.src = mediaSource;
        img.alt = title + ' preview';
        img.className = 'w-full h-full object-cover'; // Tailwind classes for full size
        mediaContainer.appendChild(img);
        
    } else if (mediaType === 'video') {
        const video = document.createElement('video');
        video.src = mediaSource;
        video.controls = true; // Show video controls (play/pause, volume)
        video.autoplay = true; // Start playing automatically
        video.loop = true; // Loop the video
        video.className = 'w-full h-full'; // Tailwind classes for full size
        mediaContainer.appendChild(video);
    }

    // 3. Show Modal with Tailwind transitions
    modal.classList.remove('hidden');
    // Force a reflow before applying the transition classes
    void modal.offsetWidth; 
    modal.classList.remove('opacity-0');
}

function closeModal() {
    const modal = document.getElementById('workModal');
    const mediaContainer = document.getElementById('modalMediaContainer');

    // 1. Pause and remove video to stop sound/playback
    const videoElement = mediaContainer.querySelector('video');
    if (videoElement) {
        videoElement.pause();
        videoElement.currentTime = 0; // Reset video to start
    }
    
    // 2. Hide Modal with Tailwind transitions
    modal.classList.add('opacity-0');
    
    // Use a timeout to fully hide the element after the transition ends
    setTimeout(() => {
        modal.classList.add('hidden');
        mediaContainer.innerHTML = ''; // Clean up media content
    }, 300); // Must match the CSS transition duration (e.g., duration-300)
}

// Optional: Close modal on 'Escape' key press
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape' && !document.getElementById('workModal').classList.contains('hidden')) {
        closeModal();
    }
});