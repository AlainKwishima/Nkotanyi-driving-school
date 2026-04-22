const url = 'https://www.youtube.com/embed/Ok6UQ-b9yJc?si=6EH95AKw6qS1xEzZ';
const match = url.match(/(?:youtube\.com\/embed\/|youtu\.be\/|youtube\.com\/watch\?v=)([^"&?/\s]{11})/i);
console.log(match ? match[1] : null);
