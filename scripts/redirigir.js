document.addEventListener('DOMContentLoaded', function() {
        document.getElementById('btnSimplex').addEventListener('click', function() {
            window.location.href = 'simplex.html';
        });
    
        document.getElementById('btnGrafico').addEventListener('click', function() {
            window.location.href = 'grafico.html';
        });

        document.getElementById('btndosfases').addEventListener('click', function() {
            window.location.href = 'paginas/dos_faces.html';
        });

        document.getElementById('btnVogel').addEventListener('click', function() {
            window.location.href = 'vogel.html';
        });
    
    // Opcional: Redirección con retraso para efecto visual
    /*
    document.getElementById('btnSimplex').addEventListener('click', function() {
        this.style.transform = 'scale(0.95)';
        setTimeout(() => {
            window.location.href = 'simplex.html';
        }, 300);
    });
    */
});
