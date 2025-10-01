import { PageProps } from '@adonisjs/inertia/types';
import { usePage } from '@inertiajs/react';
import {
  Notification,
  Affix,
  Transition,
  Portal,
  Group,
  Box,
} from '@mantine/core';
import { useEffect, useMemo, useState } from 'react';
import { TbAlertCircle, TbCheck, TbInfoCircle } from 'react-icons/tb';

type FlashType = 'info' | 'success' | 'error' | 'warning';

type FlashPageProps = PageProps & {
  flash: { type: FlashType; message: string } | null;
};

interface FlashMessagesProps {
  flash?: { type: FlashType; message: string } | null;
  autoCloseMs?: number | null; // null => pas d’auto close
}

export function FlashMessages({ flash, autoCloseMs = 5000 }: FlashMessagesProps = {}) {
  const { props } = usePage<FlashPageProps>();
  const current = useMemo(() => flash ?? props.flash, [flash, props.flash]);
  const [opened, setOpened] = useState<boolean>(!!current);

  useEffect(() => {
    setOpened(!!current);
  }, [current]);

  useEffect(() => {
    if (!opened || !autoCloseMs) return;
    const id = setTimeout(() => setOpened(false), autoCloseMs);
    return () => clearTimeout(id);
  }, [opened, autoCloseMs]);

  if (!current) return null;

  return (
    <Portal>
      <Affix position={{ top: 12, left: 0, right: 0 }}>
        <Transition mounted={opened} transition="slide-down" duration={200} timingFunction="ease">
          {(styles) => (
            <Box style={{ ...styles, display: 'flex', justifyContent: 'center' }}>
              <Group justify="center" style={{ width: '100%' }}>
                <Notification
                  withCloseButton
                  onClose={() => setOpened(false)}
                  icon={getNotificationIcon(current.type)}
                  color={getNotificationColor(current.type)}
                  title={getNotificationTitle(current.type)}
                  radius="xl"
                  maw={720}
                  style={{
                    boxShadow: '0 10px 30px rgba(0,0,0,.35)',
                    backdropFilter: 'blur(6px)',
                  }}
                >
                  {current.message}
                </Notification>
              </Group>
            </Box>
          )}
        </Transition>
      </Affix>
    </Portal>
  );
}

function getNotificationColor(type: FlashType | undefined) {
  switch (type) {
    case 'info':
      return 'ocean' as any; // retombe sur 'blue' si palette absente
    case 'success':
      return 'green';
    case 'error':
      return 'red';
    case 'warning':
      return 'yellow';
    default:
      return 'gray';
  }
}

function getNotificationIcon(type: FlashType | undefined) {
  switch (type) {
    case 'info':
      return <TbInfoCircle />;
    case 'success':
      return <TbCheck />;
    case 'error':
    case 'warning':
      return <TbAlertCircle />;
    default:
      return <TbInfoCircle />;
  }
}

function getNotificationTitle(type: FlashType | undefined) {
  switch (type) {
    case 'info':
      return 'Information';
    case 'success':
      return 'Succès';
    case 'error':
      return 'Erreur';
    case 'warning':
      return 'Attention';
    default:
      return 'Message';
  }
}
