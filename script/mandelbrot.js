const cvs = document.querySelector("canvas"),
ctx = cvs.getContext("2d");

const WIDTH = Math.round(innerWidth),
HEIGHT = Math.round(innerHeight);
let RE_START = -2,
RE_END = 1,
IM_START = -1,
IM_END = 1,
MAXITERS = 0,
defhue = 270,
zoomval = 1,
hasZoomed = false,
initialpos = [],
mousedown = false,
mousepos = [],
RESOG = RE_START,
REDOG = RE_END,
IMSOG = IM_START,
IMDOG = IM_END,
MOUSEPOSOG = [...mousepos],
pixels = []

for(let i = 0; i < HEIGHT; i++) {
    pixels.push([])
}

cvs.height = HEIGHT
cvs.width = WIDTH

function HSVtoRGB(h, s, v) {
    h = ((h % 360) + 360) % 360; // Normalize hue to [0, 360)
    s = Math.max(0, Math.min(1, s)); // Clamp saturation to [0, 1]
    v = Math.max(0, Math.min(1, v)); // Clamp value to [0, 1]

    const c = v * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = v - c;

    let r = 0, g = 0, b = 0;

    if (h < 60) {
        r = c; g = x;
    } else if (h < 120) {
        r = x; g = c;
    } else if (h < 180) {
        g = c; b = x;
    } else if (h < 240) {
        g = x; b = c;
    } else if (h < 300) {
        r = x; b = c;
    } else {
        r = c; b = x;
    }

    r = Math.round((r + m) * 255);
    g = Math.round((g + m) * 255);
    b = Math.round((b + m) * 255);

    return `rgb(${r}, ${g}, ${b})`;
}

class Complex {
    constructor(r, i) {
        this.r = r;
        this.i = i;
    }
    static multiply(c1, c2) {
        let r = c1.r * c2.r + (c1.i * c2.i * -1)
        let i = c1.r * c2.i + c1.i * c2.r
        return new Complex(r, i)
    }
    static add(c1, c2) {
        let r = c1.r + c2.r
        let i = c1.i + c2.i
        return new Complex(r, i)
    }
    static square(c1) {
        return Complex.multiply(c1, c1)
    }
    static modulus(c1) {
        return Math.sqrt((c1.r ** 2) + (c1.i ** 2))
    }
    //TODO: add more complex operations
}

function zoom(ratio) {
    console.log("zoomed!")
    let trueratio = ratio;
    if(ratio < 1) {
        trueratio = 1/ratio
    }
    console.log(ratio, trueratio)
    let RE_SPAN = RE_END - RE_START
    let IM_SPAN = IM_END - IM_START
    RE_SPAN /= (trueratio * 2)
    IM_SPAN /= (trueratio * 2)
    if(ratio > 1) {
        RE_START += RE_SPAN
        RE_END -= RE_SPAN
        IM_START += IM_SPAN
        IM_END -= IM_SPAN
    } else {
        RE_START -= RE_SPAN
        RE_END += RE_SPAN
        IM_START -= IM_SPAN
        IM_END += IM_SPAN
    }
    MAXITERS = 0
}

function mandelbrot(c, maxiters = -1) {
    let z = new Complex(0, 0)
    let n = 0
    while (Complex.modulus(z) <= 4 && (n < maxiters || maxiters < 0)) {
        z = Complex.add(Complex.square(z), c);
        n++
    }
    return n;
}

let oldpixels = []

function draw() {
    if(oldpixels != pixels) {
        ctx.clearRect(0, 0, WIDTH, HEIGHT)
        for(let x = 0; x < WIDTH; x++) {
            for(let y = 0; y < HEIGHT; y++) {
                ctx.fillStyle = pixels[y][x]
                ctx.fillRect(x, y, 1, 1)
            }
        }
        oldpixels = [...pixels]
    }
    hasZoomed = false
}

function update() {
    MAXITERS++
    if(!mousedown) {
        RESOG = RE_START
        REDOG = RE_END
        IMSOG = IM_START
        IMDOG = IM_END
        MOUSEPOSOG = [...mousepos]
    }
    if(mousedown) {
        RE_START = (RESOG + ((MOUSEPOSOG[0] / Math.abs(zoomval)) - (mousepos[0] / Math.abs(zoomval))) / WIDTH)
        RE_END = (REDOG + ((MOUSEPOSOG[0] / Math.abs(zoomval)) - (mousepos[0] / Math.abs(zoomval))) / WIDTH)
        IM_START = (IMSOG + ((MOUSEPOSOG[1] / Math.abs(zoomval)) - (mousepos[1] / Math.abs(zoomval))) / HEIGHT)
        IM_END = (IMDOG + ((MOUSEPOSOG[1] / Math.abs(zoomval)) - (mousepos[1] / Math.abs(zoomval))) / HEIGHT)
    }

    for(let x = 0; x < WIDTH; x++) {
        for(let y = 0; y < HEIGHT; y++) {
            c = new Complex(RE_START + (x / WIDTH) * (RE_END - RE_START), IM_START + (y / HEIGHT) * (IM_END - IM_START))
            m = mandelbrot(c, MAXITERS)
            hue = 360-((m * 360) / MAXITERS)
            rgbcolor = HSVtoRGB(hue + defhue, 255, hue/360)
            pixels[y][x] = rgbcolor
        }
    }
}

document.addEventListener("mousewheel", e => {
    if(!hasZoomed) {
        zoomSpeed = Math.abs(e.deltaY);
        if(e.deltaY > 0) {
            zoom(1/(zoomSpeed/60)) 
        } else if(e.deltaY < 0) {
            zoom(zoomSpeed/60)
        }
        hasZoomed = true;
        zoomval = 2 / (IM_START - IM_END)
    }
})

addEventListener("keydown", e => {
    switch(e.keyCode) {
        case 37:
            MAXITERS = 0
            RE_START -= 0.25/Math.abs(zoomval)
            RE_END -= 0.25/Math.abs(zoomval)
            break;
        case 38:
            MAXITERS = 0
            IM_START -= 0.25/Math.abs(zoomval)
            IM_END -= 0.25/Math.abs(zoomval)
            break;
        case 40:
            MAXITERS = 0
            IM_START += 0.25/Math.abs(zoomval)
            IM_END += 0.25/Math.abs(zoomval)
            break;
        case 39:
            MAXITERS = 0
            RE_START += 0.25/Math.abs(zoomval)
            RE_END += 0.25/Math.abs(zoomval)
            break;
    }
})

addEventListener("mousedown", e => {
    mousedown = true
})

addEventListener("mousemove", e => {
    mousepos = [e.pageX, e.pageY]
})

addEventListener("mouseup", () => {
    mousedown = false
})

function main() {
    update()
    draw()
    requestAnimationFrame(main)
}

main()