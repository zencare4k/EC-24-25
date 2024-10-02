function getRandomColor() {
    const r = Math.floor(Math.random() * 256); 
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    return `rgb(${r}, ${g}, ${b})`; 
}

const button = document.getElementById('changeColorButton');
button.addEventListener('click', function() {
    document.body.style.backgroundColor = getRandomColor();
});
