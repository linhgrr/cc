// Standardized button styles for consistent UI across the application

export const buttonStyles = {
  // Primary button - main actions (translate, save, etc.)
  primary: "bg-[#004098] text-white px-6 py-2.5 rounded-full shadow-sm hover:bg-[#002e6e] transition-colors duration-200 flex items-center justify-center",
  
  // Primary button with fixed width for consistent sizing
  primaryFixed: "bg-[#004098] text-white px-6 py-2.5 w-48 rounded-full shadow-sm hover:bg-[#002e6e] transition-colors duration-200 flex items-center justify-center",
  
  // Secondary button - less prominent actions (language selection, etc.)
  secondary: "bg-[#F0F7FF] border border-[#0066CC] text-[#0066CC] px-6 py-2 rounded-full shadow-sm hover:bg-[#E6F0FF] transition-colors duration-200 flex items-center justify-center",
  
  // Secondary button with fixed width
  secondaryFixed: "bg-[#F0F7FF] border border-[#0066CC] text-[#0066CC] px-6 py-2 w-48 rounded-full shadow-sm hover:bg-[#E6F0FF] transition-colors duration-200 flex items-center justify-center",
  
  // Icon button - small circular buttons for controls
  icon: "w-8 h-8 bg-[#004098] text-white rounded-full shadow-sm hover:bg-[#002e6e] transition-colors duration-200 flex items-center justify-center",
  
  // Icon button secondary style
  iconSecondary: "w-8 h-8 bg-[#F0F7FF] border border-[#0066CC] text-[#0066CC] rounded-full shadow-sm hover:bg-[#E6F0FF] transition-colors duration-200 flex items-center justify-center",
  
  // Language toggle button - active state
  languageActive: "bg-[#004098] text-white border border-[#004098] px-6 py-2 w-48 rounded-full shadow-sm hover:bg-[#002e6e] transition-colors duration-200 flex items-center justify-center whitespace-nowrap",
  
  // Language toggle button - inactive state
  languageInactive: "bg-[#F0F7FF] text-[#0066CC] border border-[#0066CC] px-6 py-2 w-48 rounded-full shadow-sm hover:bg-[#E6F0FF] transition-colors duration-200 flex items-center justify-center whitespace-nowrap",
  
  // Browse button for file upload
  browse: "bg-[#004098] text-white text-sm px-6 py-2 rounded-full cursor-pointer shadow-sm hover:bg-[#002e6e] transition-colors duration-200"
};

// Utility function to merge custom classes with base styles
export const mergeButtonStyles = (baseStyle, customClasses = '') => {
  return `${baseStyle} ${customClasses}`.trim();
}; 