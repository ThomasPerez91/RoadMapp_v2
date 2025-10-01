import {
  Drawer,
  Flex,
  Group,
  Title,
  useMantineTheme,
  rem,
} from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import {
  createContext,
  useContext,
  useState,
  type ReactNode,
  type FC,
  useCallback,
} from 'react';

type DrawerOptions = {
  title: string;
  content: ReactNode;
};

type AppDrawerContextType = {
  open: (options: DrawerOptions) => void;
  close: () => void;
};

const AppDrawerContext = createContext<AppDrawerContextType | null>(null);

export function useAppDrawer() {
  const context = useContext(AppDrawerContext);
  if (!context) throw new Error('useAppDrawer must be used within AppDrawerProvider');
  return context;
}

export const AppDrawerProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const theme = useMantineTheme();
  const isMobile = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`, false);
  const isShort = useMediaQuery('(max-height: 500px)');

  const [opened, { open: openDrawer, close }] = useDisclosure(false);
  const [options, setOptions] = useState<DrawerOptions>({ title: '', content: null });

  const handleOpen = useCallback((opts: DrawerOptions) => {
    setOptions(opts);
    openDrawer();
  }, [openDrawer]);

  const position = (isMobile || isShort) ? 'bottom' : 'right';
  const size = (isMobile || isShort) ? '100%' : 'md';

  return (
    <AppDrawerContext.Provider value={{ open: handleOpen, close }}>
      {children}

      <Drawer.Root
        opened={opened}
        onClose={close}
        position={position}
        size={size}
        padding="md"
        withinPortal
        trapFocus
        lockScroll
        closeOnEscape
        closeOnClickOutside
        keepMounted={false}
        styles={{
          overlay: {
            backdropFilter: 'blur(2px)',
          },
          content: {
            backdropFilter: 'blur(8px)',
            background: 'rgba(7,14,24,.88)',
            borderLeft: position === 'right' ? '1px solid rgba(255,255,255,.06)' : undefined,
            borderTop: position === 'bottom' ? '1px solid rgba(255,255,255,.06)' : undefined,
          },
          header: {
            position: 'sticky',
            top: 0,
            zIndex: 1,
            background: 'transparent',
            borderBottom: '1px solid rgba(255,255,255,.06)',
            paddingBlock: rem(8),
          },
          body: {
            padding: 'var(--mantine-spacing-md)',
          },
          title: {
            fontWeight: 700,
            color: 'var(--mantine-color-text)',
          },
        }}
      >
        <Drawer.Overlay />
        <Drawer.Content>
          <Drawer.Header>
            <Drawer.Title>
              <Group gap="xs" wrap="nowrap">
                <Title order={5} style={{ fontWeight: 700 }}>
                  {options.title || '…'}
                </Title>
              </Group>
            </Drawer.Title>
            <Drawer.CloseButton />
          </Drawer.Header>

          <Drawer.Body>
            <Flex direction="column" gap="md">
              {options.content ?? <div>Aucun contenu</div>}
            </Flex>
          </Drawer.Body>
        </Drawer.Content>
      </Drawer.Root>
    </AppDrawerContext.Provider>
  );
};
