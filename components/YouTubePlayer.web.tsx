import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';

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
  onError,
}) => {
  useEffect(() => {
    // Simulate onReady for web
    if (onReady) {
      setTimeout(onReady, 500);
    }
  }, [onReady]);

  return (
    <View style={[styles.container, { height }]}>
      <iframe
        width="100%"
        height="100%"
        src={`https://www.youtube.com/embed/${videoId}?controls=1&modestbranding=1&rel=0&playsinline=1&autoplay=${play ? 1 : 0}`}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title="YouTube video player"
        onLoad={onReady}
        onError={() => onError?.('The YouTube player failed to load.')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#000',
  },
});

export default YouTubePlayerWrapper;
