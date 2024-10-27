import { useRouter } from 'next/router'
import { Box, Grid, VStack, Text, Button, useColorModeValue } from '@chakra-ui/react'
import { FaArrowRight } from 'react-icons/fa'

interface Story {
  name: string
  slug: string
  description: string
}

interface StoryBoxProps {
  story: Story
  onClick: (slug: string) => void
}

const StoryBox: React.FC<StoryBoxProps> = ({ story, onClick }) => {
  const bgColor = useColorModeValue('gray.50', 'gray.700')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const hoverBg = useColorModeValue('gray.100', 'gray.600')

  return (
    <Box
      p={6}
      borderWidth="1px"
      borderRadius="lg"
      borderColor={borderColor}
      bg={bgColor}
      cursor="pointer"
      onClick={() => onClick(story.slug)}
      _hover={{
        bg: hoverBg,
        transform: 'translateY(-2px)',
        transition: 'all 0.2s',
      }}>
      <VStack spacing={4} align="flex-start">
        <Text fontSize="xl" fontWeight="bold">
          {story.name}
        </Text>
        <Text color="gray.500">{story.description}</Text>
        <Button rightIcon={<FaArrowRight />} colorScheme="blue" variant="outline" size="sm">
          Start Adventure
        </Button>
      </VStack>
    </Box>
  )
}

const StoriesGrid: React.FC = () => {
  const router = useRouter()

  const FEATURED_STORIES: Story[] = [
    {
      name: 'In the Desert',
      slug: 'in-the-desert',
      description: 'Survive a perilous journey through the desert.',
    },
    {
      name: 'Optimistic Life',
      slug: 'optimistic-life',
      description: 'Live an adventure in a smart contract world filled with optimism.',
    },
    {
      name: 'Moussaillon des maths',
      slug: 'pirate-math',
      description: 'Relevez les défis mathématiques pour survivre en mer.',
    },
  ]

  const handleStorySelect = (storySlug: string): void => {
    router.push(`/${storySlug}`)
  }

  return (
    <VStack spacing={8} align="stretch">
      <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={6}>
        {FEATURED_STORIES.map((story) => (
          <StoryBox key={story.slug} story={story} onClick={handleStorySelect} />
        ))}
      </Grid>
    </VStack>
  )
}

export default StoriesGrid
