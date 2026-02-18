import { useRef } from 'react';
import PageBlocksRenderer from '../components/blocks/PageBlocksRenderer';
import { homePageBlocks } from '../data/pageBlocks/homeBlocks';
import useNativeEnhancements from '../hooks/useNativeEnhancements';

export default function HomePage() {
  const pageRef = useRef(null);
  useNativeEnhancements(pageRef);

  return (
    <div ref={pageRef} className="home-native-page">
      <PageBlocksRenderer blocks={homePageBlocks} />
    </div>
  );
}
