const startButton = document.getElementById('start-camera');
const videoElement = document.getElementById('webcam');

startButton.addEventListener('click', async () => {
    try {
        // Request video permissions from the browser
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: "user" }, // Use "environment" for mobile back cameras
            audio: false                   // Change to true if you need audio
        });
        
        // Link the live stream data to our HTML video element
        videoElement.srcObject = stream;
    } catch (error) {
        console.error("Error accessing the camera: ", error);
        alert("Could not access camera. Please check browser permissions.");
    }
});
