# Avero Gamemaker Engine Scripting Guide

This tutorial explains how to author narrative scripts and structure project files for the Avero Gamemaker Engine.

## 1. File Format & High-Level Architecture

All stories in Avero Gamemaker are written as standard **JSON documents**. Your JSON file acts as a single package containing two main parts:

1.  **Asset Registries:** Dictionaries mapping simple string identifiers to asset URLs or local paths for media (backgrounds, videos, character sprites, background music, and sound effects).
2.  **Character Registry:** A dictionary defining participant profiles.
3.  **Script Sequence:** An ordered list of story nodes executed step-by-step when the player advances dialogue.

## 2. Setting Up Asset Registries

Define key-value maps at the root level of your JSON object to store media references. Keys should be short, memorable identifiers used throughout your script.

- **backgrounds**: Maps background IDs to image file paths or image URLs.
- **videos**: Maps video IDs to MP4 or WebM video URLs.
- **sprites**: Maps character sprite IDs to transparent PNG image URLs.
- **music**: Maps audio track IDs to looping background music file URLs.
- **sfx**: Maps effect IDs to single-play audio effect file URLs.

## 3. Defining Characters

Under the characters root key, create an entry for every speaker in your story. Each character key maps to an object containing:

- **name**: The display name shown in the dialogue frame.
- **color**: The hex or CSS color used for theme highlights.
- **avatar**: An emoji or icon character shown beside the speaker's name.
- **sprite** _(optional)_: The default sprite key associated with this character from your sprites registry.

## 4. Authoring Script Nodes

The script array controls the progression of your visual novel. Each entry in this array represents a single frame or beat in the story.
When building script nodes, you can include any combination of the following properties depending on what happens on screen:

### Dialogue & Speaker

- Set **text** to a string containing the dialogue or narration for this node. Leaving text empty or omitted skips the dialogue box for purely visual beats.
- Set **speaker** to the key of a character defined in your character registry. Omit speaker for narrator nodes.

### Visual Scene Layer

- Set **bg** to a key from your backgrounds registry to change the backdrop.
- Set **video** to a key from your videos registry to play a looping background video instead of a static image.

### Character Sprites

- Set **sprites** to an array of sprite objects to display active characters on stage.
- Each sprite object requires:
  - **id**: The character ID matching an entry in characters.
  - **position**: Where the character stands on screen (left, center, or right).

### Audio Controls

- Set **music** to an array of music keys from your music registry. The engine will loop these active tracks and pause any previously active tracks that are no longer listed in this node.
- Set **sfx** to an array of sound effect keys from your sfx registry. Listed sound effects trigger once when the node activates.

## 5. Inline Text Formatting Rules

The engine dynamically formats markdown syntax inside your text strings without exposing dangerous HTML tags:

- **Bold Text:** Wrap words with double asterisks **text** to highlight key terms in your theme color.
- **Italic Text:** Wrap words with single asterisks _text_ to render soft or emphasized dialogue in warm accent tones.
- **Inline Code:** Wrap words with backticks `text` to display technical terms or computer code in a styled font box.

## 6. Testing & Loading Your Story

1.  Launch the Avero Gamemaker Engine interface.
2.  Open the **Avero Menu** in the top header.
3.  Click **Load JSON File** and select your saved JSON script.
4.  Use the **Script Node Jump** input in the menu to jump directly to specific node numbers for rapid testing during script development.
