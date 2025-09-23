// Gallery Dynamic Mapping Script
class GalleryMapper {
    constructor() {
        this.galleryData = null;
        this.galleryContainer = null;
    }

    // Load gallery data from JSON file
    async loadGalleryData() {
        try {
            const response = await fetch('./gallery-data.json');
            this.galleryData = await response.json();
            return this.galleryData;
        } catch (error) {
            console.error('Error loading gallery data:', error);
            return null;
        }
    }

    // Check if image file exists
    async checkImageExists(imagePath) {
        try {
            const response = await fetch(imagePath, { method: 'HEAD' });
            return response.ok;
        } catch (error) {
            return false;
        }
    }

    // Scan Assets folder for p{number}.jpg files
    async scanPortfolioImages() {
        const portfolioImages = [];
        let imageNumber = 1;
        
        // Check for images from p1.jpg onwards
        while (imageNumber <= 50) { // Check up to p50.jpg
            const imagePath = `Assets/Portfolio/p${imageNumber}.jpg`;
            const exists = await this.checkImageExists(imagePath);
            
            if (exists) {
                portfolioImages.push({
                    number: imageNumber,
                    path: imagePath,
                    filename: `p${imageNumber}.jpg`
                });
            } else if (imageNumber > 35) {
                // If we haven't found any images for 6 consecutive numbers after p35, stop
                break;
            }
            
            imageNumber++;
        }
        
        return portfolioImages;
    }

    // Generate gallery item HTML
    generateGalleryItemHTML(imageInfo, galleryData) {
        const data = galleryData || {
            title: `Portfolio Item ${imageInfo.number}`,
            description: 'Beautiful interior design showcase',
            detailedDescription: `Portfolio showcase item ${imageInfo.number} featuring modern interior design.`
        };

        return `<div class="gallery-item">
    <a href="${imageInfo.path}" data-lightbox="portfolio" data-title="${data.title} - ${data.detailedDescription}">
        <img src="${imageInfo.path}" alt="${data.title}" />
        <div class="gallery-overlay">
            <div class="gallery-info">
                <h3>${data.title}</h3>
                <p>${data.description}</p>
            </div>
        </div>
    </a>
</div>`;
    }

    // Map gallery data to found images
    mapGalleryData(portfolioImages, galleryData) {
        return portfolioImages.map(imageInfo => {
            const matchingData = galleryData.galleryItems.find(item => item.id === imageInfo.number);
            return {
                ...imageInfo,
                data: matchingData
            };
        });
    }

    // Generate complete gallery HTML
    async generateGalleryHTML() {
        try {
            // Load gallery data
            const galleryData = await this.loadGalleryData();
            if (!galleryData) {
                console.error('Failed to load gallery data');
                return null;
            }

            // Scan for portfolio images
            const portfolioImages = await this.scanPortfolioImages();
            console.log(`Found ${portfolioImages.length} portfolio images`);

            // Map data to images
            const mappedGallery = this.mapGalleryData(portfolioImages, galleryData);

            // Generate HTML for all items
            const galleryHTML = mappedGallery
                .map(item => this.generateGalleryItemHTML(item, item.data))
                .join('\n');

            return galleryHTML;
        } catch (error) {
            console.error('Error generating gallery HTML:', error);
            return null;
        }
    }

    // Initialize gallery on page load
    async initializeGallery() {
        // Find gallery container
        this.galleryContainer = document.querySelector('.gallery-grid');
        
        if (!this.galleryContainer) {
            console.error('Gallery container not found');
            return;
        }

        // Generate and insert gallery HTML
        const galleryHTML = await this.generateGalleryHTML();
        
        if (galleryHTML) {
            // Clear the container and add the gallery items
            this.galleryContainer.innerHTML = '';
            this.galleryContainer.innerHTML = galleryHTML;
            
            console.log('Gallery successfully generated dynamically');
            
            // Ensure proper grid layout
            this.galleryContainer.style.display = 'grid';
            
            // Reinitialize lightbox for the new dynamic content
            this.initializeLightboxForDynamicContent();
        } else {
            console.error('Failed to generate gallery HTML');
            // Show error message
            this.galleryContainer.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 2rem;"><p>Error loading gallery. Please refresh the page.</p></div>';
        }
    }

    // Initialize lightbox functionality for dynamically added content
    initializeLightboxForDynamicContent() {
        // Wait a moment for DOM to update
        setTimeout(() => {
            // Find all lightbox links
            const lightboxLinks = document.querySelectorAll('[data-lightbox="portfolio"]');
            
            if (lightboxLinks.length === 0) {
                console.warn('No lightbox links found for initialization');
                return;
            }

            // Remove any existing lightbox event listeners by cloning and replacing elements
            lightboxLinks.forEach((link, index) => {
                const newLink = link.cloneNode(true);
                link.parentNode.replaceChild(newLink, link);
                
                // Add click event for lightbox
                newLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.openLightbox(index, lightboxLinks);
                });
            });
            
            console.log(`Lightbox initialized for ${lightboxLinks.length} images`);
        }, 100);
    }

    // Open lightbox with image
    openLightbox(index, allLinks) {
        // Create or get lightbox container
        let lightbox = document.getElementById('portfolioLightbox');
        
        if (!lightbox) {
            // Create lightbox if it doesn't exist
            const lightboxContainer = document.createElement('div');
            lightboxContainer.id = 'lightboxContainer';
            document.body.appendChild(lightboxContainer);
            
            lightboxContainer.innerHTML = `
                <div id="portfolioLightbox" class="lightbox">
                    <div class="lightbox-content">
                        <span class="close-lightbox">&times;</span>
                        <div class="lightbox-details">
                            <h3></h3>
                            <p></p>
                        </div>
                        <img class="lightbox-img" src="" alt="">
                        <div class="lightbox-nav">
                            <button class="lightbox-prev">❮</button>
                            <button class="lightbox-next">❯</button>
                        </div>
                    </div>
                </div>
            `;
            
            lightbox = document.getElementById('portfolioLightbox');
        }

        // Get elements
        const img = lightbox.querySelector('.lightbox-img');
        const title = lightbox.querySelector('.lightbox-details h3');
        const description = lightbox.querySelector('.lightbox-details p');
        const closeBtn = lightbox.querySelector('.close-lightbox');
        const prevBtn = lightbox.querySelector('.lightbox-prev');
        const nextBtn = lightbox.querySelector('.lightbox-next');

        let currentIndex = index;

        // Function to show image
        const showImage = (idx) => {
            const link = allLinks[idx];
            const imgSrc = link.getAttribute('href');
            const titleText = link.getAttribute('data-title') || '';
            const [titlePart, descPart] = titleText.split(' - ');
            
            img.src = imgSrc;
            img.alt = titlePart || 'Portfolio Image';
            title.textContent = titlePart || 'Portfolio Image';
            description.textContent = descPart || '';
        };

        // Show initial image
        showImage(currentIndex);
        lightbox.classList.add('show');
        document.body.style.overflow = 'hidden';

        // Event listeners
        closeBtn.onclick = () => {
            lightbox.classList.remove('show');
            document.body.style.overflow = '';
        };

        prevBtn.onclick = () => {
            currentIndex = currentIndex > 0 ? currentIndex - 1 : allLinks.length - 1;
            showImage(currentIndex);
        };

        nextBtn.onclick = () => {
            currentIndex = currentIndex < allLinks.length - 1 ? currentIndex + 1 : 0;
            showImage(currentIndex);
        };

        // Close on outside click
        lightbox.onclick = (e) => {
            if (e.target === lightbox) {
                lightbox.classList.remove('show');
                document.body.style.overflow = '';
            }
        };

        // Keyboard navigation
        const keyHandler = (e) => {
            if (lightbox.classList.contains('show')) {
                if (e.key === 'Escape') {
                    lightbox.classList.remove('show');
                    document.body.style.overflow = '';
                } else if (e.key === 'ArrowLeft') {
                    currentIndex = currentIndex > 0 ? currentIndex - 1 : allLinks.length - 1;
                    showImage(currentIndex);
                } else if (e.key === 'ArrowRight') {
                    currentIndex = currentIndex < allLinks.length - 1 ? currentIndex + 1 : 0;
                    showImage(currentIndex);
                }
            }
        };

        // Remove existing key listener and add new one
        document.removeEventListener('keydown', keyHandler);
        document.addEventListener('keydown', keyHandler);
    }

    // Get gallery statistics
    async getGalleryStats() {
        const galleryData = await this.loadGalleryData();
        const portfolioImages = await this.scanPortfolioImages();
        
        return {
            totalDataEntries: galleryData ? galleryData.galleryItems.length : 0,
            totalImagesFound: portfolioImages.length,
            mappedItems: Math.min(
                galleryData ? galleryData.galleryItems.length : 0,
                portfolioImages.length
            )
        };
    }
}

// Initialize gallery when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    const galleryMapper = new GalleryMapper();
    
    // Check if we're on the gallery page
    if (document.querySelector('.gallery-grid')) {
        // Add a small delay to ensure everything is loaded
        setTimeout(async () => {
            await galleryMapper.initializeGallery();
            
            // Log statistics
            const stats = await galleryMapper.getGalleryStats();
            console.log('Gallery Statistics:', stats);
        }, 100);
    }
});

// Export for potential external use
window.GalleryMapper = GalleryMapper;