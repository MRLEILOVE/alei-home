/// <reference types="astro/client" />

declare module 'aplayer' {
  interface AudioTrack {
    name: string;
    artist: string;
    url: string;
    cover?: string;
    lrc?: string;
  }
  interface Options {
    container: HTMLElement;
    audio: AudioTrack[];
    theme?: string;
    autoplay?: boolean;
    preload?: 'none' | 'metadata' | 'auto';
    volume?: number;
    mutex?: boolean;
    loop?: 'all' | 'one' | 'none';
    listFolded?: boolean;
    listMaxHeight?: string;
    lrcType?: number;
    storageName?: string;
  }
  export default class APlayer {
    constructor(options: Options);
    audio: HTMLAudioElement;
    list: { clear(): void };
    on(event: 'listswitch', listener: (event: { index: number }) => void): void;
    on(event: string, listener: () => void): void;
    play(): void;
    pause(): void;
    destroy(): void;
  }
}
