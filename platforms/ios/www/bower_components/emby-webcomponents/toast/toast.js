define(["paper-toast"],function(){var t=0;return function(e){var n=document.createElement("paper-toast");n.setAttribute("text",e.text),n.id="toast"+t++,document.body.appendChild(n),setTimeout(function(){n.show()},300)}});