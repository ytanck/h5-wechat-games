function play68_init() {
	updateShare(0);
}

function updateShare(bestScore) {
	imgUrl = '';
	lineLink = '';
	descContent = "";
	updateShareScore(bestScore);
	appid = '';
}

function updateShareScore(bestScore) {
	setTimeout(function () {
		window.P.showShare({
			score: bestScore,
			og: {
				title: "Jump high, fly higher, let's go." + " I got " + bestScore + " points in this game, come on!"
			}
		})
	}, 1000)
}