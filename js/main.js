var canvas;
var ctx;
var gameLoop;

// player-lengths
var sightDist = 8;

var endgameFrames = [];
var endgameFramePattern = "Scoopy_Death_FINAL/scoopy_deathFINAL%d.png";
var endgameFrameCount = 21;

var endgameFrameDelay = 100;
var currentEndgameFrameDelay;
var currentEndgameFrame;

var playEnding;

// lime green
var endTextColor = 'rgb(0,255,0)';
var lossText = "a sacrifice for mr. scoopy's eye-scream";
var scoreTextTemplate = "your value: %d";

var score;
var scoopyScorePenalty = 30;
var scorePerScoopFrame = 1;

var endingStartDelay;
var iceCreamSpawnChance = 1.0 / 50;

var cones;
var splatImage;

var player;
var scoopy;
var currentLevel;
var objects;

var gradOuterRad;
var gradInnerRad;

var chaseMusic;
var ambientMusic;
var sfx = {
	"death": "Eyeball_scooping.wav",
	"throwCone": "Ice_cream_drop.wav",
	"pickup": "Ice_cream_pick_up.wav",
	"distract": "Scoopy_eats_ice_cream.wav",
	"alert": [
		"scoopy_eyes_cream.wav",
		"scoopy_sacrifice.wav",
	],
	"ambient": [
		"scoopy_grumble_1.wav",
		"scoopy_grumble_2.wav",
		"scoopy_grumble_3.wav",
		"scoopy_sundae_drive.wav",
		"scoopy_searching_come_out.wav",
		"scoopy_searching_where_are_you.wav",
	],
}

var lost = false;
var creditsPlaying = false;
var creditY = 0;

var frameDuration = 20;

// the music is set to a different loudness than the sfx
// so, need to make them closer to the same loudness
var musicVolume = 0.15;

function init() {
	canvas = document.getElementById('kiwijam');
	ctx = canvas.getContext('2d');

	for (var i = 0; i < endgameFrameCount; ++i) {
		var image = new Image();
		image.src = fullImagePath(endgameFramePattern.replace(/%d/, i));
		endgameFrames.push(image);
	}

	addAllObjectImages(foo.level.objects);

	splatImage = new Image();
	splatImage.src = fullImagePath("SplatDetailed.png");

	resizeCanvas();
	registerListeners();

	ambientMusic = new Audio('resources/music/GameJamGREEN_1.mp3');
	ambientMusic.loop = true;

	chaseMusic = new Audio('resources/music/GameJamCHASE_Celli&Glock.mp3');
	chaseMusic.loop = true;
	chaseMusic.volume = musicVolume;

	for (var key in sfx) {
		if (typeof sfx[key] == 'object') {
			for (var index in sfx[key]) {
				var audio = new Audio('resources/sfx/' + sfx[key][index]);
				sfx[key][index] = audio;
			}
		} else {
			var audio = new Audio('resources/sfx/' + sfx[key]);
			sfx[key] = audio;
		}
	}
	startGame();
	gameLoop = setInterval(runGame, frameDuration);
}

function isSfxPlaying() {
	for (var key in sfx) {
		if (sfx[key] instanceof Array) {
			for (var index in sfx[key]) {
				if (!sfx[key][index].paused) {
					return true;
				}
			}
		} else {
			if (!sfx[key].paused) {
				return true;
			}
		}
	}
	return false;
}

function playRandomAudio(arr) {
	var randIndex = Math.floor(Math.random() * arr.length);
	arr[randIndex].play();
}

function fullImagePath(path) {
	return "resources/images/" + path;
}

var objImageList = [];

function addAllObjectImages(objectList){
	for(objectIndex in objectList){
		if(objectList[objectIndex].images.length > 1){
			for(imageIndex in objectList[objectIndex].images){
				var tmpImage = new Image();
				tmpImage.src = fullImagePath(objectList[objectIndex].images[imageIndex]);
				objImageList.push(tmpImage);
			}
		}else{
			var tmpImage = new Image();
			tmpImage.src = fullImagePath(objectList[objectIndex].images[0]);
			objImageList.push(tmpImage);
		}
	}
}

function getImage(url){
	for(i in objImageList){
		if(objImageList[i].src.indexOf(url) != -1){
			return objImageList[i];
		}
	}
	return undefined;
}

function addObject(objDef, x, y, tileSize) {
	objects.push({
		def: objDef,
		imageVariation: Math.floor(Math.random() * objDef.images.length),
		pos: new Point(x * tileSize, y * tileSize),
	});
}

function startGame() {
	score = 0;
	objects = [];
	cones = [];

	loadMapInit();

	currentEndgameFrame = 0;
	currentEndgameFrameDelay = endgameFrameDelay;

	player = {
		speed: 5,
		// velocity is not really a point, but it's an xy tuple
		vel: new Point(),
		pos: new Point(4814, 904),
		rad: 50,
		scoopCount: 3,
		frameCount: {
			'r': 8,
			'l': 8,
			'd': 7,
			'u': 7,
		},
		frameCols: {
			'r': 8,
			'l': 8,
			'd': 7,
			'u': 7,
		},
		frame: 0,
		frameDelay: 60,
		currentFrameDelay: 0,
		facing: 'd',
		images: {
			'r': 'Right',
			'l': 'Left',
			'd': 'Front',
			'u': 'Back',
		},
	};
	for (var facing in player.images) {
		var image = new Image();
		image.src = fullImagePath("characters/Alice_" + player.images[facing] + ".png");
		player.images[facing] = image;
	}

	scoopy = {
		walkSpeed: 4,
		runSpeed: 5.2,
		// amount that Mr. Scoopy slows down when forcing his way through walls
		slowdown: 4.0,
		wanderAngle: 0,
		pos: new Point(3600, 1260),
		rad: 100,
		// delays in ms
		currentDelay: 0,
		eatDelay: 700,
		frameCount: {
			'l': 8,
			'r': 8,
			'd': 8,
			'u': 8,
		},
		frameCols: {
			'l': 4,
			'r': 4,
			'd': 4,
			'u': 4,
		},
		frame: 0,
		frameDelay: 60,
		currentFrameDelay: 0,
		facing: 'l',
		images: {
			'l': 'leftside',
			'r': 'right',
			'd': 'front',
			'u': 'back',
		},
	};
	for (var facing in scoopy.images) {
		var image = new Image();
		image.src = fullImagePath("characters/scoopy_" + scoopy.images[facing] + "_sprite.png");
		scoopy.images[facing] = image;
	}

	gradOuterRad = player.rad * sightDist;
	gradInnerRad = 25;

	endingStartDelay = 1000;
	creditsPlaying = false;
	playEnding = false;
	creditY = canvas.height + 50;

	ambientMusic.volume = musicVolume;
	ambientMusic.play();
}

function runGame() {
	scoopy.walkSpeed += 0.005;
	scoopy.runSpeed += 0.005;
	if (!lost) {
		if (isCollidable((player.vel.times(player.speed).x + player.pos.x), player.pos.y)){
			player.vel.x = 0;
		}
		if(isCollidable(player.pos.x, (player.vel.times(player.speed).y + player.pos.y))){
			player.vel.y = 0;
		}
		player.pos.offsetBy(player.vel.normalize().times(player.speed));
		interactWithObjects();
		animateAlice();

		moveScoopy();
	} else {
		gradOuterRad = Math.max(30, gradOuterRad - 3);
		gradInnerRad = Math.max(0, gradInnerRad - 1);
		if (gradOuterRad <= 30) {
			endingStartDelay -= frameDuration;
			if (endingStartDelay < 0) {
				if (!playEnding) {
					sfx.death.play();
				}
				playEnding = true;
			}
		}
		if (playEnding) {
			if (currentEndgameFrame < endgameFrameCount) {
				currentEndgameFrameDelay -= frameDuration;
				if (currentEndgameFrameDelay < 0) {
					currentEndgameFrameDelay = endgameFrameDelay;
					currentEndgameFrame += 1;
				}
			} else {
				creditsPlaying = true;
			}
		}
	}
	console.log("x:" + player.pos.x + ", y:" + player.pos.y);
	drawScreen();

}

function throwCone() {
	if (player.scoopCount <= 0) {
		return false;
	}
	player.scoopCount--;
	sfx.throwCone.play();
	var offset = scoopy.pos.minus(player.pos);
	var dir = offset.normalize();

	var pos = dir.times(player.rad * 1).offsetBy(player.pos);
	cones.push(pos);
	return true;
}

function scoopyDist() {
	return player.pos.minus(scoopy.pos);
}

function moveScoopy() {
	if (scoopy.currentDelay > 0) {
		scoopy.currentDelay -= frameDuration;
		return;
	}

	var offset = scoopyDist();
	var playerDir = offset.normalize();
	var cone = undefined;

	for (var i = 0; i < cones.length; ++i) {
		var otherOffset = cones[i].minus(scoopy.pos);
		if (otherOffset.length() < offset.length()) {
			offset = otherOffset;
			cone = i;
		}
	}

	var dir = offset.normalize();

	var x = 0;
	var y = 0;
	var running = false;
	var chaseDistance = player.rad * (sightDist - 3);

	if (offset.length() < chaseDistance) {
		var scaleFactor = (1 - (offset.length() / chaseDistance));

		if (!ambientMusic.paused) {
			ambientMusic.pause();
			chaseMusic.play();
			playRandomAudio(sfx.alert);
		}
		x = dir.x * scoopy.runSpeed;
		y = dir.y * scoopy.runSpeed;
		if (offset.length() < player.rad / 2) {
			if (cone === undefined) {
				lose();
			} else {
				sfx.distract.play();
				cones.splice(cone, 1);
				scoopy.currentDelay = scoopy.eatDelay;
			}
		}
		score -= scoopyScorePenalty;
		running = true;
	} else {
		if (!chaseMusic.paused) {
			chaseMusic.pause();
			ambientMusic.play();
		}
		scoopy.wanderAngle += (Math.random() - 0.5) / 2;
		// we want to bias Mr. Scoopy's walk towards the player
		x = (Math.cos(scoopy.wanderAngle) + playerDir.x) / 2 * scoopy.walkSpeed;
		y = (Math.sin(scoopy.wanderAngle) + playerDir.y) / 2 * scoopy.walkSpeed;
		score += player.scoopCount * scorePerScoopFrame;
	}

	if (isCollidable(scoopy.pos.x + x, scoopy.pos.y)){
		x /= scoopy.slowdown;
	}
	if(isCollidable(scoopy.pos.x, scoopy.pos.y + y)){
		y /= scoopy.slowdown;
	}
	scoopy.pos.x += x;
	scoopy.pos.y += y;

	if (!isSfxPlaying()) {
		var chance = running ? 0.02 : 0.01;
		if (Math.random() < chance) {
			playRandomAudio(sfx.ambient);
		}
	}

	animateScoopy(x, y, running);
}

function lose() {
	lost = true;
	drawScreen();
}

function resizeCanvas(e) {
	canvas.width = document.body.clientWidth;
	canvas.height = document.body.clientHeight;
}

function drawScreen() {
	if(creditsPlaying){
		ctx.fillStyle = 'rgb(0,0,0)';
		ctx.rect(0, 0, canvas.width, canvas.height);
		ctx.fill();

		ctx.textAlign="center";
		ctx.fillStyle = endTextColor;

		// var credit = "";
		for(index in credits.creditText){
			var credit = credits.creditText[index];
			textWidth = ctx.measureText(scoreText).width;
			if(credit.charAt(0) !='#'){
				ctx.font = "bold 30pt Lucida Sans MS";
			} else{
				ctx.font = "bold 20pt Lucida Sans MS";
				credit = credit.substring(1);
			}
			ctx.fillText(credit, canvas.width / 2,index*canvas.width/25 +   creditY);

		}
		creditY -= 2;
	} else {
		ctx.save()

		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.translate(-player.pos.x + canvas.width/2, -player.pos.y + canvas.height/2);

		//Draw map
		tileEngine(ctx, player.pos.x, player.pos.y);
		// var obCount = 0;
		var currentObjectImage;
		for (var i = 0; i < objects.length; ++i) {
			if((Math.abs(objects[i].pos.x - player.pos.x) < canvas.width/2 + canvas.width*.1 && Math.abs(objects[i].pos.y - player.pos.y) < canvas.height/2+canvas.height*.1) || objects[i].def.images[objects[i].imageVariation] == "finaltexturelist/gym_overlay_HUGE.png"){
				currentObjectImage = getImage(objects[i].def.images[objects[i].imageVariation]);
				ctx.drawImage(currentObjectImage, objects[i].pos.x, objects[i].pos.y);
				// obCount++;
			}
		}
		// console.log(obCount);

		drawCharacter(player);

		ctx.fillStyle = 'beige';
		for (var i = 0; i < cones.length; ++i) {
			var pos = cones[i];
			ctx.drawImage(splatImage, pos.x - (splatImage.width/2), pos.y - (splatImage.height/2));
		}

		drawCharacter(scoopy);

		ctx.restore();
		var gradRef1 = new Point(canvas.width/2, canvas.height/2);
		var gradRef2 = new Point(canvas.width/2, canvas.height/2);
		var gradient = ctx.createRadialGradient(gradRef1.x, gradRef1.y, gradOuterRad, gradRef2.x, gradRef2.y, gradInnerRad);
		gradient.addColorStop(0,"rgba(0,0,0,1)");
		gradient.addColorStop(1,"rgba(0,100,150,0.2)");
		ctx.fillStyle = gradient;
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		if (lost && !playEnding) {
			ctx.textAlign="left";
			ctx.fillStyle = endTextColor;
			ctx.font = "bold 30pt Comic Sans MS";

			var textWidth = ctx.measureText(lossText).width;
			ctx.fillText(lossText, (canvas.width - textWidth) / 2, 70);

			var scoreText = scoreTextTemplate.replace(/%d/, score);
			textWidth = ctx.measureText(scoreText).width;
			ctx.fillText(scoreText, (canvas.width - textWidth) / 2, canvas.height - 60);
		}

		if (playEnding && currentEndgameFrame < endgameFrameCount) {
			ctx.drawImage(endgameFrames[currentEndgameFrame], (canvas.width - 500)/2, (canvas.height - 500)/2);
		}
	}
}

function credits(ctx){

}

function drawCharacter(char) {
	var image = char.images[char.facing];
	var diam = char.rad * 2;
	var frameColCount = char.frameCols[char.facing];
	var frameCol = char.frame % frameColCount;
	var frameRow = Math.floor(char.frame / frameColCount);
	ctx.drawImage(image, diam * frameCol, diam * frameRow, diam, diam, char.pos.x - char.rad, char.pos.y - char.rad, diam, diam);
}
