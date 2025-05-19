
export function updateProgress(percent, message = null) {
  const progressContainer = document.getElementById("progressContainer");
  const progressBar = document.getElementById("progressBar");
  const progressStatus = document.getElementById("progressStatus");
  const progressLabel = document.getElementById("progressLabel");
  
  // Show the progress container with a fade-in effect
  if (progressContainer.style.display === "none" || progressContainer.style.display === "") {
    progressContainer.style.opacity = "0";
    progressContainer.style.display = "block";
    
    // Trigger reflow to make the transition work
    void progressContainer.offsetWidth;
    
    progressContainer.style.transition = "opacity 0.3s ease";
    progressContainer.style.opacity = "1";
  }
  
  // Round the percentage for display
  const roundedPercent = Math.round(percent);
  
  // Update the progress bar width with a smooth transition
  progressBar.style.width = `${percent}%`;
  
  // Update the status text
  progressStatus.textContent = `${roundedPercent}%`;
  
  // Update the message if provided
  if (message) {
    progressLabel.textContent = message;
    
    // Add a small animation to the label when it changes
    progressLabel.style.transition = "transform 0.2s ease";
    progressLabel.style.transform = "translateY(-2px)";
    setTimeout(() => {
      progressLabel.style.transform = "translateY(0)";
    }, 200);
  }
  
  // Handle completion
  if (percent >= 100) {
    // Change status text
    progressStatus.textContent = `Complete`;
    
    // Add success class to the progress bar
    progressBar.classList.add("success");
    
    // Fade out the progress container after a delay
    setTimeout(() => {
      progressContainer.style.transition = "opacity 0.5s ease";
      progressContainer.style.opacity = "0";
      
      // Hide after the transition completes
      setTimeout(() => {
        progressContainer.style.display = "none";
        progressBar.classList.remove("success");
      }, 500);
    }, 1500);
  }
}
