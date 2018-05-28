var CameraControl = function (camera) {

    this.camera = camera;
    this.isMoving = false;
    this.bounds = new scintilla.BoundingBox(camera.bounds);

    var to = {
        x: 0,
        y: 0
    };
    var from = {
        x: 0,
        y: 0
    };
    var moveTimer = 0;

    this.move = function (x, y) {
        this.isMoving = true;
        from.x = this.camera.x;
        from.y = this.camera.y;
        to.x = from.x + x;
        to.y = from.y + y;
        moveTimer = 0;
    };

    this.update = function (dt) {

        if (this.isMoving === false)
            return;

        this.bounds.copy(this.camera.bounds);
        this.bounds.decrease(64, 64);
        this.bounds.move(64, 64);

        moveTimer += dt / 0.5;

        if (moveTimer >= 1) {
            this.camera.x = to.x;
            this.camera.y = to.y;
            moveTimer = 0;
            this.isMoving = false;
        } else {
            this.camera.x = scintilla.Math.lerp(from.x, to.x, moveTimer);
            this.camera.y = scintilla.Math.lerp(from.y, to.y, moveTimer);
        }

    };

}






var GameScene = function () {

    var cameraControl;
    var scrolls;
    var rect;
    var renderRect;
    this.start = function () {
        rect = this.create.rectangle();
        renderRect = rect.modules.get('render');
        renderRect.width = 64;
        renderRect.height = 64;
        rect.position.set(VIEW.w / 2 - 32, VIEW.h / 2 - 32);

        cameraControl = new CameraControl(this.camera);
        scrolls = new ScrollsControl(this.game.system.render.canvas, {x:VIEW.w, y: VIEW.h+64});

    };

    this.update = function (dt) {

        if (cameraControl.isMoving === false) {
            var vertical = this.key.pressed(scintilla.KeyCode.Down)-this.key.pressed(scintilla.KeyCode.Up);
            var horizontal = this.key.pressed(scintilla.KeyCode.Right) - this.key.pressed(scintilla.KeyCode.Left);

            if (vertical !== 0) {
                cameraControl.move(0, 64 * vertical);
            } else if (horizontal !== 0) {
                cameraControl.move(64 * horizontal, 0);
            }
        }

        cameraControl.update(dt);

        scrolls.update(cameraControl);

        /*if (!renderRect.bounds.intersects(cameraControl.bounds)) {
            rect.y = cameraControl.camera.y;
        }*/

    };

    this.gui = function(drawer) {

        scrolls.render(drawer);

    };



};

var VIEW = {
    w: 64*15,
    h: 64*10,
};

var config = {
    width: VIEW.w,
    height: VIEW.h,
    parent: "body",
    debug: false,
    pixelated: false,
    roundPixels: false,
};

var game = new scintilla.Game(config);



game.scene.add('game', GameScene);
game.scene.set('game');



var HORIZONTAL = 0;
var VERTICAL = 1;

var Thumb = function (scroll) {
    this.scroll = scroll;
    this.size = 0;
    this.location = 0;


    this.render = function (drawer) {


        drawer.color = '#fF0';
        if (this.scroll.side === VERTICAL) {
            drawer.rect(this.scroll.x, this.location, this.scroll.arrowSize, this.size);
        } else {
            drawer.rect(this.location, this.scroll.y, this.size, this.scroll.arrowSize);
        }
    }

    this.setLocation = function (location) {
        //var val = location / this.scroll.trackLength;
        //this.location = location * (this.scroll.max - this.scroll.min);
        this.location = scintilla.Math.lerp(this.scroll.min, this.scroll.max, location);
    }

}

var Scroll = function (side, arrowSize) {
    this.side = side;
    this.arrowSize = arrowSize;
    this.trackLength = 0;
    this.thumb = new Thumb(this, side);
    this.x = 0;
    this.y = 0;
    this.min = 0;
    this.max = 0;

    this.render = function (canvas, drawer) {

        if (this.side === VERTICAL) {
   
            // bg
            drawer.color = '#Aab';
            drawer.rect(this.x, this.y, arrowSize, canvas.height);
            // thumb
            this.thumb.render(drawer);
            // buttons
            drawer.color = '#F00a';
            drawer.rect(this.x, this.y, arrowSize, arrowSize);
            drawer.rect(this.x, this.y + (canvas.height - arrowSize), arrowSize, arrowSize);
        } else {
            // bg
            drawer.color = '#Aab';
            drawer.rect(this.x, this.y, canvas.width - arrowSize, arrowSize);
            // thumb
            this.thumb.render(drawer);
            // buttons
            drawer.color = '#F00a';
            drawer.rect(this.x, this.y, arrowSize, arrowSize);
            drawer.rect(this.x + (canvas.width - arrowSize * 2), this.y, arrowSize, arrowSize);
        }
    };

    this.compute = function (canvas, viewport, scrollArea) {

        if (this.side === VERTICAL) {
            this.trackLength = scrollArea.y;

            this.x = canvas.width - this.arrowSize;
            this.y = 0;//this.arrowSize;
            this.min = this.arrowSize;
            this.max = canvas.height - this.arrowSize;

            // thumbHeight = m_originalViewportSize.Value / (Maximum - Minimum + m_originalViewportSize.Value) * trackLength;
            this.thumb.size = Math.max(50, this.trackLength * (viewport.y / World.height));
        } else {

            this.trackLength = scrollArea.x;

            this.x = 0; 
            this.y = canvas.height - this.arrowSize;
            this.min = this.arrowSize;
            this.max = canvas.width - this.arrowSize * 2;
            this.thumb.size = Math.max(50, this.trackLength * (viewport.x / World.width));

        }

        
        //this.thumb.size = viewport.y / (this.max - this.min + viewport.y) * this.trackLength;

        this.thumb.setLocation(0);
    }


}

var ScrollsControl = function (canvas) {


    this.canvas = canvas;


    var arrowSize = 25;

    init = function () {


        //this.viewportRatio = {x:0,y:0};
        //this.viewportRatio.x = canvas.width / worldSize.x;
        //this.viewportRatio.y = canvas.height / worldSize.y;


        this.viewport = {
            x: canvas.width,
            y: canvas.height
        };
        this.scrollLength = {
            x:  canvas.width - arrowSize * 3,
            y:  canvas.height - arrowSize * 2
        };

        this.verticalScroll = new Scroll(VERTICAL, arrowSize);
        this.horizontalScroll = new Scroll(HORIZONTAL, arrowSize);
        this.verticalScroll.compute(canvas, this.viewport, this.scrollLength);
        this.horizontalScroll.compute(canvas, this.viewport, this.scrollLength);
    }.call(this);

    this.update = function (cameraControl) {
        if (!cameraControl.isMoving)
            return;

        this.verticalScroll.thumb.setLocation(cameraControl.camera.y / World.height);
        this.horizontalScroll.thumb.setLocation(cameraControl.camera.x / World.width);
    }

    this.render = function (drawer) {

        var canvas = drawer.canvas;

        this.verticalScroll.render(canvas, drawer);
        this.horizontalScroll.render(canvas, drawer);
    }

}

var World = {
    width : 64 * 20,
    height : 64 * 12
};

