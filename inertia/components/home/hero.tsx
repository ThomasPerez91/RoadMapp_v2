import { Button, Container, Text, Title } from '@mantine/core'
import classes from './hero.module.css'
import { AiOutlineUserAdd } from 'react-icons/ai'
import { useAppDrawer } from '../drawer'
import { OAuth } from '../auth/oauth'

export const Hero = () => {
  const registerIcon = <AiOutlineUserAdd size={24} />
  const { open } = useAppDrawer()

  return (
    <div className={classes.root}>
      <Container size="lg">
        <div className={classes.inner}>
          <div className={classes.content}>
            <Title className={classes.title}>
              Suivez vos trajets et déplacements avec{' '}
              <Text
                component="span"
                inherit
                variant="gradient"
                gradient={{ from: 'red', to: 'orange' }}
              >
                RoadMapp
              </Text>
            </Title>

            <Text className={classes.description} mt={30}>
              Enregistrez vos adresses, calculez les distances parcourues et gardez une trace
              précise de vos trajets. Simplifiez la déclaration de vos frais kilométriques avec
              RoadMapp.
            </Text>
            <Button
              rightSection={registerIcon}
              variant="gradient"
              gradient={{ from: 'teal', to: 'cyan', deg: 90 }}
              size="xl"
              className={classes.control}
              mt={40}
              onClick={() =>
                open({
                  title: 'Inscription',
                  content: <OAuth mode="register" />,
                })
              }
            >
              <b>Inscription</b>
            </Button>
          </div>
        </div>
      </Container>
    </div>
  )
}
