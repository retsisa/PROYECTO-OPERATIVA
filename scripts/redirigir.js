document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('btnSimplex').addEventListener('click', function() {
        window.location.href = 'simplex.html';
    });
    
    document.getElementById('btnGrafico').addEventListener('click', function() {
        window.location.href = 'grafico.html';
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