import React, { useState } from 'react';
import { connect } from 'react-redux';
import { ApplicationState} from '../store/index'
import { setName } from '../store/user/actions';
import { UserState } from '../store/user/types';

interface StateProps {
    user: UserState
}
interface DispatchProps {
    setName: typeof setName
}
interface OwnProps {
    isOpen: boolean
}
type Props = StateProps & DispatchProps & OwnProps;

function UserInfoModal(props: Props) {
    return <></>;
    //TODO: Implement this later
    // const [tempName, setTempName] = useState(props.user.name);
    // return (
    //     !props.isOpen ? <></> :
    //     <>

    //     {/* <input 
    //                             className="form-control form-control-lg form-group font-weight-bold" 
    //                             type="text" 
    //                             placeholder= {"Your name"}
    //                             // autoFocus
    //                             value={tempName}
    //                             onChange={(event) => {
    //                                 setTempName(event.target.value);
    //                             }} /> */}
    //     </> 
    // );
}

function mapState(state: ApplicationState) : StateProps {
    return {
        user: state.user
    };
}
const mapDispatch : DispatchProps = {
    setName: setName
}

export default connect<StateProps, DispatchProps, OwnProps, ApplicationState>(
    mapState,
    mapDispatch
)(UserInfoModal)


