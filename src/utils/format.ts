export function formatPhoneNumber(phone: string): string {
  // If empty, return "N/A"
  if (!phone || phone.trim() === "") {
    return "N/A";
  }

  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, "");
  
  // Format Indian numbers (10 digits)
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)}-${cleaned.slice(5)}`;
  } 
  // Already has India country code (91 + 10 digits = 12 digits)
  else if (cleaned.length === 12 && cleaned.startsWith("91")) {
    return `+91 ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  }
  // Handle 11 digits with leading 0 (remove 0 and add +91)
  else if (cleaned.length === 11 && cleaned.startsWith("0")) {
    return `+91 ${cleaned.slice(1, 6)}-${cleaned.slice(6)}`;
  }
  // Handle international format (starting with +91)
  else if (cleaned.length > 10 && cleaned.startsWith("91")) {
    // Extract the last 10 digits if there are more than 12 digits
    const lastTen = cleaned.slice(-10);
    return `+91 ${lastTen.slice(0, 5)}-${lastTen.slice(5)}`;
  }
  
  // If none of the above formats match, try to make it look like an Indian number
  if (cleaned.length >= 10) {
    const lastTen = cleaned.slice(-10);
    return `+91 ${lastTen.slice(0, 5)}-${lastTen.slice(5)}`;
  }
  
  // Return original if not matching expected formats
  return `+91 ${phone}`;
} 