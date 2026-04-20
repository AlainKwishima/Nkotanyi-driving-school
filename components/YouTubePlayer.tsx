import React from 'react';
import YoutubePlayer from 'react-native-youtube-iframe';

interface YouTubePlayerProps {
  videoId: string;
  height?: number;
  play?: boolean;
  onReady?: () => void;
  onChangeState?: (state: string) => void;
  onError?: (error: string) => void;
}

const YouTubePlayerWrapper: React.FC<YouTubePlayerProps> = ({
  videoId,
  height = 210,
  play = false,
  onReady,
  onChangeState,
  onError,
}) => {
  return (
      <YoutubePlayer
        height={height}
        videoId={videoId}
        play={play}
      onReady={onReady}
      onChangeState={onChangeState}
      onError={(e: string) => onError?.(`YouTube Error ${e}`)}
      webViewStyle={{ opacity: 0.99 }}
      webViewProps={{
        allowsFullscreenVideo: true,
        androidLayerType: 'software',
      }}
      initialPlayerParams={{
        controls: true,
        modestbranding: true,
        rel: false,
      }}
    />
  );
};

export default YouTubePlayerWrapper;
