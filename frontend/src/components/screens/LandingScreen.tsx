import LandingPageHTML from '../../landing/index.html.js'

const LandingScreen = () => {
    return <div dangerouslySetInnerHTML={{ __html: LandingPageHTML }}></div>
}

export default LandingScreen
