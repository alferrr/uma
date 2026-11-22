import { Config } from '@remotion/cli/config';

// Screens, fonts and the logo live in ./assets.
Config.setPublicDir('./assets');
Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(95);
Config.setConcurrency(2);

// The downloaded headless browser failed to start on this machine; use the installed Chrome.
Config.setBrowserExecutable('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome');
