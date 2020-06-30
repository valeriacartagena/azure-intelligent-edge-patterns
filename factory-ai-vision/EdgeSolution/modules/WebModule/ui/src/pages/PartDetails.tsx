import React, { useState, useEffect } from 'react';
import { Flex, Input, TextArea, Button, Menu, Grid, Alert } from '@fluentui/react-northstar';
import { Link, useLocation, Switch, Route, useHistory } from 'react-router-dom';
import axios from 'axios';

import { CapturePhotos } from '../components/CapturePhoto';
import { UploadPhotos } from '../components/UploadPhotos';
import { useQuery } from '../hooks/useQuery';
import { CapturedImagesContainer } from '../components/CapturePhoto/CapturePhotos';

export const PartDetails = (): JSX.Element => {
  const partId = useQuery().get('partId');
  const [goLabelImageIdx, setGoLabelImageIdx] = useState<number>(null);

  return (
    <Grid columns={'repeat(12, 1fr)'} styles={{ gridColumnGap: '20px', height: '100%' }}>
      <LeftPanel partId={partId} goLabelImageIdx={goLabelImageIdx} setGoLabelImageIdx={setGoLabelImageIdx} />
      <RightPanel partId={partId} goLabelImageIdx={goLabelImageIdx} />
    </Grid>
  );
};

const RightPanel = ({ partId, goLabelImageIdx }): JSX.Element => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const history = useHistory();

  useEffect(() => {
    if (partId) {
      axios
        .get(`/api/parts/${partId}/`)
        .then(({ data }) => {
          setName(data.name);
          setDescription(data.description);
          return void 0;
        })
        .catch((err) => {
          console.error(err);
        });
    }
  }, [partId]);

  const onSave = (): void => {
    axios({
      method: 'PUT',
      url: `/api/parts/${partId}/`,
      data: {
        name,
        description,
      },
    })
      .then(() => {
        history.push(`/parts/`);
        return void 0;
      })
      .catch((err) => {
        setError(JSON.stringify(err.response.data));
      });
  };

  return (
    <div
      style={{
        height: '20%',
        display: 'flex',
        flexFlow: 'column',
        justifyContent: 'space-between',
        gridColumn: '8 / span 5',
      }}
    >
      <Input
        placeholder="Enter Part Name..."
        fluid
        // styles={{ fontSize: '1.5em' }}
        value={name}
        onChange={(_, newProps): void => {
          setName(newProps.value);
        }}
      />
      <TextArea
        placeholder="Enter Description..."
        // design={{ height: '60%' }}
        value={description}
        onChange={(_, newProps): void => {
          setDescription(newProps.value);
        }}
      />
      <Flex space="around">
        <Button content="Save" primary onClick={onSave} disabled={!name} />
      </Flex>
      {!!error && <Alert danger content={error} dismissible />}
      <CapturedImagesContainer partId={parseInt(partId, 10)} goLabelImageIdx={goLabelImageIdx} />
    </div>
  );
};

const LeftPanel = ({ partId, goLabelImageIdx, setGoLabelImageIdx }): JSX.Element => {
  return (
    <Flex column gap="gap.small" styles={{ gridColumn: '1 / span 7' }}>
      {partId ? <Tab partId={partId} /> : null}
      <Switch>
        <Route path={`/parts/detail/capturePhotos`}>
          <CapturePhotos
            partId={parseInt(partId, 10)}
            goLabelImageIdx={goLabelImageIdx}
            setGoLabelImageIdx={setGoLabelImageIdx}
          />
        </Route>
        <Route path={`/parts/detail/uploadPhotos`}>
          <UploadPhotos partId={parseInt(partId, 10)} />
        </Route>
      </Switch>
    </Flex>
  );
};

const Tab = ({ partId }): JSX.Element => {
  const items = [
    {
      key: 'uploadPhotos',
      as: Link,
      to: `/parts/detail/uploadPhotos?partId=${partId}`,
      content: 'Upload Photos',
    },
    {
      key: 'capturePhotos',
      as: Link,
      to: `/parts/detail/capturePhotos?partId=${partId}`,
      content: 'Capture Photo',
    },
  ];

  const { pathname } = useLocation();
  const activeIndex = items.findIndex((ele) => ele.to.split('?')[0] === pathname);

  return <Menu items={items} activeIndex={activeIndex} pointing primary />;
};
