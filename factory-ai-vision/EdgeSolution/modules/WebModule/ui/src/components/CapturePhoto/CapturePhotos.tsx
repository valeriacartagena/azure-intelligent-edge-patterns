import React, { useState, useEffect, Dispatch } from 'react';
import * as R from 'ramda';
import { Flex, Dropdown, Text, DropdownItemProps, Grid } from '@fluentui/react-northstar';
import { Link, Prompt } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';

import { useCameras } from '../../hooks/useCameras';
import { State } from '../../store/State';
import { Camera } from '../../store/camera/cameraTypes';
import LabelingPageDialog from '../LabelingPageDialog';
import LabelDisplayImage from '../LabelDisplayImage';
import { RTSPVideo } from '../RTSPVideo';
import { getLabelImages } from '../../store/image/imageActions';
import { LabelImage } from '../../store/image/imageTypes';
import { formatDropdownValue } from '../../util/formatDropdownValue';
import { CaptureLabelMode } from '../RTSPVideo/RTSPVideo.type';
import { captureImage } from '../../action/creators/imageActionCreators';

export const CapturePhotos: React.FC<{
  partId: number;
  partName: string;
  goLabelImageIdx: number;
  setGoLabelImageIdx: Dispatch<number>;
}> = ({ partId, partName, goLabelImageIdx, setGoLabelImageIdx }) => {
  const dispatch = useDispatch();
  const [selectedCamera, setSelectedCamera] = useState<Camera>(null);
  const availableCameras = useCameras();

  const onCapturePhoto = (streamId: string, mode: CaptureLabelMode): void => {
    dispatch(captureImage(streamId));
    // if (mode === CaptureLabelMode.PerImage) setGoLabelImageIdx(filteredImages.length);
  };

  useEffect(() => {
    dispatch(getLabelImages());
  }, [dispatch]);

  const autoPlay = availableCameras.length === 1 && !!selectedCamera;

  return (
    <Flex gap="gap.small" styles={{ height: '100%' }}>
      <Flex column gap="gap.small" styles={{ width: '70%', height: '100%' }}>
        <CameraSelector
          selectedCamera={selectedCamera}
          setSelectedCamera={setSelectedCamera}
          availableCameras={availableCameras}
        />
        <div style={{ minHeight: '600px', height: '100%' }}>
          <RTSPVideo
            rtsp={selectedCamera?.rtsp}
            partId={partId}
            partName={partName}
            canCapture={true}
            onCapturePhoto={onCapturePhoto}
            autoPlay={autoPlay}
          />
        </div>
      </Flex>
      <Flex column gap="gap.small" styles={{ width: '30%', minWidth: '450px' }}>
        <CapturedImagesContainer partId={partId} goLabelImageIdx={goLabelImageIdx} />
      </Flex>
    </Flex>
  );
};

const CameraSelector = ({ selectedCamera, setSelectedCamera, availableCameras }): JSX.Element => {
  const items: DropdownItemProps[] = availableCameras.map((ele) => ({
    header: ele.name,
    content: {
      key: ele.id,
    },
  }));

  const onDropdownChange = (_, data): void => {
    if (data.value === null) setSelectedCamera((prev) => prev);
    else {
      const { key } = data.value.content;
      const newSelectedCamera = availableCameras.find((ele) => ele.id === key);
      if (newSelectedCamera) setSelectedCamera(newSelectedCamera);
    }
  };

  // FIXME Find a better way to replace the setState in the effect
  useEffect(() => {
    if (availableCameras.length === 1) setSelectedCamera(availableCameras[0]);
  }, [availableCameras, setSelectedCamera]);

  return (
    <Flex gap="gap.small" vAlign="center">
      <Text>Select Camera</Text>
      <Dropdown items={items} onChange={onDropdownChange} value={formatDropdownValue(selectedCamera)} />
      <Link to="/cameras">Add Camera</Link>
    </Flex>
  );
};

const imageSelector = (state: State, partId: number): LabelImage[] =>
  Object.values(state.labelImages.entities)
    .filter((e) => e.part === partId && e.isRelabel === false)
    // FIXME: Redesign the shape
    .map((img) => ({
      id: img.id,
      image: img.image,
      labels: '',
      part: {
        id: img.part,
        name: state.parts.entities[img.part].name,
      },
      is_relabel: img.isRelabel,
      confidence: 0,
    }));

export const CapturedImagesContainer = ({ partId, goLabelImageIdx }): JSX.Element => {
  const images = useSelector<State, LabelImage[]>((state) => imageSelector(state, partId));

  const isValid = images.filter((image) => image.labels).length >= 15;
  const imageCount = images.length;

  return (
    <Flex column styles={{ height: '100%' }}>
      <Text>Total: {imageCount}</Text>
      {!isValid && <Text error>*Please capture and label more then 15 images</Text>}
      <Grid
        columns="2"
        styles={{
          border: '1px solid grey',
          gridGap: '10px',
          padding: '10px',
          borderColor: isValid ? '' : 'red',
          justifyItems: 'center',
          alignItems: 'center',
          overflow: 'scroll',
          maxHeight: '600px',
        }}
      >
        {images.map((image, i) => (
          <div key={image.id} style={{ height: '100%', width: '100%' }}>
            <span>{i + 1}</span>
            <div style={{ height: 150, width: 200 }}>
              <LabelDisplayImage labelImage={image} pointerCursor />
            </div>
          </div>
        ))}
        <LabelingPageDialog
          imageIndex={0}
          images={images}
          forceOpen={false}
          trigger={null}
          isRelabel={false}
        />
      </Grid>
      <Prompt
        when={imageCount < 15}
        message={(location): string => {
          if (location.state === 'AFTER_DELETE') return;
          return 'The count of images is less than 15, which may cause error when configure part identification. Sure you want to leave?';
        }}
      />
    </Flex>
  );
};
