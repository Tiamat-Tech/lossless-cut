import React, { memo } from 'react';
import prettyMs from 'pretty-ms';
import { FaSave, FaPlus, FaMinus, FaTag, FaSortNumericDown, FaAngleRight, FaArrowCircleUp, FaArrowCircleDown } from 'react-icons/fa';
import { AiOutlineSplitCells } from 'react-icons/ai';
import { motion } from 'framer-motion';
import Swal from 'sweetalert2';
import { useTranslation } from 'react-i18next';

import { saveColor } from './colors';
import { getSegColors } from './util/colors';

const buttonBaseStyle = {
  margin: '0 3px', borderRadius: 3, color: 'white', cursor: 'pointer',
};

const neutralButtonColor = 'rgba(255, 255, 255, 0.2)';


const Segment = memo(({ seg, index, currentSegIndex, formatTimecode, getFrameCount, segOrderDecrease, segOrderIncrease, invertCutSegments, onClick }) => {
  const { t } = useTranslation();

  const duration = seg.end - seg.start;
  const durationMs = duration * 1000;

  const isActive = !invertCutSegments && currentSegIndex === index;

  function renderNumber() {
    if (invertCutSegments) return <FaSave style={{ color: saveColor, marginRight: 5, verticalAlign: 'middle' }} size={14} />;

    const {
      segBgColor, segBorderColor,
    } = getSegColors(seg);

    return <b style={{ color: 'white', padding: '0 3px', marginRight: 5, background: segBgColor, border: `1px solid ${isActive ? segBorderColor : 'transparent'}`, borderRadius: 10, fontSize: 12 }}>{index + 1}</b>;
  }

  const timeStr = `${formatTimecode(seg.start)} - ${formatTimecode(seg.end)}`;

  return (
    <motion.div
      role="button"
      onClick={() => !invertCutSegments && onClick(index)}
      positionTransition
      style={{ originY: 0, margin: '5px 0', border: `1px solid rgba(255,255,255,${isActive ? 1 : 0.3})`, padding: 5, borderRadius: 5, position: 'relative' }}
      initial={{ scaleY: 0 }}
      animate={{ scaleY: 1 }}
      exit={{ scaleY: 0 }}
    >
      <div style={{ fontSize: 310 / timeStr.length, whiteSpace: 'nowrap', color: 'white', marginBottom: 3 }}>
        {renderNumber()}
        <span>{timeStr}</span>
      </div>
      <div style={{ fontSize: 12, color: 'white' }}>{seg.name}</div>
      <div style={{ fontSize: 13 }}>
        {t('Duration')} {prettyMs(durationMs)}
      </div>
      <div style={{ fontSize: 12 }}>
        ({Math.floor(durationMs)} ms, {getFrameCount(duration)} frames)
      </div>

      {isActive && (
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} style={{ position: 'absolute', right: 0, bottom: 0, display: 'flex', flexDirection: 'column' }}>
          <FaArrowCircleUp size={20} role="button" onClick={segOrderDecrease} />
          <FaArrowCircleDown size={20} role="button" onClick={segOrderIncrease} />
        </motion.div>
      )}
    </motion.div>
  );
});

const SegmentList = memo(({
  formatTimecode, cutSegments, outSegments, getFrameCount, onSegClick,
  currentSegIndex, invertCutSegments,
  updateCurrentSegOrder, addCutSegment, removeCutSegment,
  onLabelSegmentPress, currentCutSeg, segmentAtCursor, toggleSideBar, splitCurrentSegment,
}) => {
  const { t } = useTranslation();

  let headerText = t('Segments to export:');

  if (!outSegments && invertCutSegments) headerText = t('Make sure you have no overlapping segments.');
  else if (!outSegments || outSegments.length === 0) headerText = t('No segments to export.');

  async function onReorderSegsPress() {
    if (cutSegments.length < 2) return;
    const { value } = await Swal.fire({
      title: `${t('Change order of segment')} ${currentSegIndex + 1}`,
      text: `Please enter a number from 1 to ${cutSegments.length} to be the new order for the current segment`,
      input: 'text',
      inputValue: currentSegIndex + 1,
      showCancelButton: true,
      inputValidator: (v) => {
        const parsed = parseInt(v, 10);
        return Number.isNaN(parsed) || parsed > cutSegments.length || parsed < 1 ? t('Invalid number entered') : undefined;
      },
    });

    if (value) {
      const newOrder = parseInt(value, 10);
      updateCurrentSegOrder(newOrder - 1);
    }
  }

  function segOrderDecrease(e) {
    updateCurrentSegOrder(currentSegIndex - 1);
    e.stopPropagation();
  }
  function segOrderIncrease(e) {
    updateCurrentSegOrder(currentSegIndex + 1);
    e.stopPropagation();
  }

  const renderFooter = () => {
    const { segActiveBgColor: currentSegActiveBgColor } = getSegColors(currentCutSeg);
    const { segActiveBgColor: segmentAtCursorActiveBgColor } = getSegColors(segmentAtCursor);

    return (
      <>
        <div style={{ display: 'flex', padding: '5px 0', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid grey' }}>
          <FaPlus
            size={30}
            style={{ ...buttonBaseStyle, background: neutralButtonColor }}
            role="button"
            title={t('Add segment')}
            onClick={addCutSegment}
          />

          <FaMinus
            size={30}
            style={{ ...buttonBaseStyle, background: cutSegments.length >= 2 ? currentSegActiveBgColor : neutralButtonColor }}
            role="button"
            title={`${t('Delete current segment')} ${currentSegIndex + 1}`}
            onClick={removeCutSegment}
          />

          <FaSortNumericDown
            size={20}
            title={t('Change segment order')}
            role="button"
            style={{ ...buttonBaseStyle, padding: 4, background: currentSegActiveBgColor }}
            onClick={onReorderSegsPress}
          />

          <FaTag
            size={20}
            title={t('Label segment')}
            role="button"
            style={{ ...buttonBaseStyle, padding: 4, background: currentSegActiveBgColor }}
            onClick={onLabelSegmentPress}
          />

          <AiOutlineSplitCells
            size={20}
            title={t('Split segment at cursor')}
            role="button"
            style={{ ...buttonBaseStyle, padding: 4, background: segmentAtCursor ? segmentAtCursorActiveBgColor : neutralButtonColor }}
            onClick={splitCurrentSegment}
          />
        </div>

        <div style={{ padding: 10, boxSizing: 'border-box', borderBottom: '1px solid grey', display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
          <div>{t('Segments total:')}</div>
          <div>{formatTimecode(outSegments.reduce((acc, { start, end }) => (end - start) + acc, 0))}</div>
        </div>
      </>
    );
  };

  return (
    <>
      <div style={{ padding: '0 10px', overflowY: 'scroll', flexGrow: 1 }} className="hide-scrollbar">
        <div style={{ fontSize: 14, marginBottom: 10 }}>
          <FaAngleRight
            title={t('Close sidebar')}
            size={18}
            style={{ verticalAlign: 'middle', color: 'white' }}
            role="button"
            onClick={toggleSideBar}
          />

          {headerText}
        </div>

        {outSegments && outSegments.map((seg, index) => {
          const id = seg.uuid || `${seg.start}`;
          return <Segment key={id} seg={seg} index={index} onClick={onSegClick} getFrameCount={getFrameCount} formatTimecode={formatTimecode} currentSegIndex={currentSegIndex} segOrderDecrease={segOrderDecrease} segOrderIncrease={segOrderIncrease} invertCutSegments={invertCutSegments} />;
        })}
      </div>

      {outSegments && renderFooter()}
    </>
  );
});

export default SegmentList;
