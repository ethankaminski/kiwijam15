var keys = {
	'enter': 13,
	
	'space': 32,
	
	'left': 37,
	'right': 39,
	
	'up': 38,
	'down': 40,
}

var keysHeld = [];


function registerListeners() {
	document.addEventListener('keydown', handleKeyDown);
	document.addEventListener('keyup', handleKeyUp);
	window.addEventListener('resize', resizeCanvas);
}

function handleKeyDown(e) {
	switch (e.keyCode) {
		case keys.space:
			throwCone();
			e.preventDefault();
			break;
		case keys.left:
			player.vel.x = -1;
			e.preventDefault();
			break;
		case keys.right:
			player.vel.x = 1;
			e.preventDefault();
			break;
			
		case keys.up:
			player.vel.y = -1;
			e.preventDefault();
			break;
		case keys.down:
			player.vel.y = 1;
			e.preventDefault();
			break;
	}
	
	if (lost && e.keyCode == keys.enter) {
		lost = false;
		startGame();
	}
	
	keysHeld[e.keyCode] = true;
}

function handleKeyUp(e) {
	switch (e.keyCode) {
		case keys.left:
		case keys.right:
			player.vel.x = 0;
			break;
		case keys.up:
		case keys.down:
			player.vel.y = 0;
			break;
	}
	
	keysHeld[e.keyCode] = false;
}
