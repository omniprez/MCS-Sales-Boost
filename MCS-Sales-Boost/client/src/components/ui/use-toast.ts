// A simple mock toast implementation for the demo
export const toast = ({ title, description, variant }: { title: string; description: string; variant: string }) => {
  console.log(`Toast: ${variant} - ${title} - ${description}`);
  
  // Create a toast element
  const toastEl = document.createElement('div');
  toastEl.className = `fixed top-4 right-4 z-50 p-4 rounded-md shadow-md ${
    variant === 'destructive' ? 'bg-red-100 border-red-400 text-red-700' : 'bg-green-100 border-green-400 text-green-700'
  }`;
  
  // Add content
  toastEl.innerHTML = `
    <div class="flex items-center">
      <div class="flex-1">
        <h3 class="font-medium">${title}</h3>
        <p class="text-sm">${description}</p>
      </div>
      <button class="ml-4 text-gray-400 hover:text-gray-600">×</button>
    </div>
  `;
  
  // Add to document
  document.body.appendChild(toastEl);
  
  // Auto-remove after 3 seconds
  setTimeout(() => {
    toastEl.classList.add('opacity-0', 'transition-opacity');
    setTimeout(() => {
      document.body.removeChild(toastEl);
    }, 300);
  }, 3000);
  
  // Add click handler to close button
  const closeBtn = toastEl.querySelector('button');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      document.body.removeChild(toastEl);
    });
  }
};
