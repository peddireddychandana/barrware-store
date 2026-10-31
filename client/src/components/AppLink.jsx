import { Link } from "react-router-dom";

/** Link that takes `href` (internal paths and hash links) and renders a React Router link. */
const AppLink = ({ href, ...props }) => <Link to={href} {...props} />;

export default AppLink;
