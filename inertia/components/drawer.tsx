import { Drawer, Flex } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { createContext, useContext, useState, type ReactNode, type FC } from 'react'

type DrawerOptions = {
  title: string
  content: ReactNode
}

type AppDrawerContextType = {
  open: (options: DrawerOptions) => void
  close: () => void
}

const AppDrawerContext = createContext<AppDrawerContextType | null>(null)

export function useAppDrawer() {
  const context = useContext(AppDrawerContext)
  if (!context) throw new Error('useAppDrawer must be used within AppDrawerProvider')
  return context
}

export const AppDrawerProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [opened, { open: openDrawer, close }] = useDisclosure(false)
  const [options, setOptions] = useState<DrawerOptions>({
    title: '',
    content: null,
  })

  const handleOpen = (opts: DrawerOptions) => {
    setOptions(opts)
    openDrawer()
    console.log('Drawer opened with options:', opts)
  }

  return (
    <AppDrawerContext.Provider value={{ open: handleOpen, close }}>
      {children}

      <Drawer.Root opened={opened} onClose={close} position="right" size="md">
        <Drawer.Overlay />
        <Drawer.Content>
          <Drawer.Header>
            <Drawer.Title>
              <b>{options.title || '...'}</b>
            </Drawer.Title>
            <Drawer.CloseButton />
          </Drawer.Header>
          <Drawer.Body>
            <Flex direction="column" gap="md">
              {options.content || <div>Aucun contenu</div>}
            </Flex>
          </Drawer.Body>
        </Drawer.Content>
      </Drawer.Root>
    </AppDrawerContext.Provider>
  )
}
