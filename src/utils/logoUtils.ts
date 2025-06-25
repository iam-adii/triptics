// Utility functions for handling logo in PDFs

export const getLogoAsBase64 = async (): Promise<string | null> => {
  try {
    // Try to fetch the logo from the public directory
    const response = await fetch('/assets/logos/urban-monk-logo.png.png');
    if (!response.ok) {
      console.warn('Logo file not found at /assets/logos/urban-monk-logo.png.png');
      return null;
    }
    
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.warn('Error loading logo:', error);
    return null;
  }
};

export const LOGO_STYLES = {
  width: 120,
  height: 36,
  objectFit: 'contain' as const,
  position: 'absolute' as const,
  top: 10,
  right: 15,
}; 