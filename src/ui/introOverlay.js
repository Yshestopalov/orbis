const timeout = 5000;

export function initIntroOverlay() {
    const overlay = document.getElementById("intro-overlay");
    if (!overlay) return;

    const destroyOverlay = () => {
        if (overlay.parentNode) {
            overlay.remove();
        }
        
        document.removeEventListener("click", destroyOverlay);
        document.removeEventListener("keydown", destroyOverlay);
    };

    document.addEventListener("click", destroyOverlay);
    document.addEventListener("keydown", destroyOverlay);
    
    setTimeout(destroyOverlay, timeout);
}