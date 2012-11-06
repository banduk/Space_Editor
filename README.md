#This is a try to organize the amazing [Space_Editor](https://github.com/chaoscollective/Space_Editor) project

The organisation of the project is totally based on the [SQLite example](https://github.com/camposer/express-examples/tree/master/sqlite) by [Rodolfo Campos](https://github.com/camposer)


## Space is a real-time collaborative code editor!

Space is built on NodeJS and uses NowJS under the hood to support websockets for realtime collaboration. The editor is built on ACE (the same front-end used in Cloud9 IDE) and uses Google's diff-match-patch to send edits information to contributors as changes are made to the code.

## Installation

You must have [Node](http://nodejs.org/) installed.

Just enter in the project folder and run:

    npm update
    npm install

## Running

Just enter in the project folder and run:

    node app

Then access your browser at http://localhost:3149


## Editing

I added the configuration file for the excellent [Sublime Text](http://www.sublimetext.com/).
To use, just open the file `space.sublime-project` with Sublime Text


## Demo

Try out Space for yourself on the demo site here:
http://spacedemo.chaoscollective.org/?project=SandboxApp

## More Details

Check out the Space overview page here for more details and a video:
http://chaoscollective.org/projects/builtinspace.html

## Libraries/Platforms used
 - NodeJS
 - NowJS
 - ACE
 - diff-match-patch

