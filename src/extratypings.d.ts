declare class VRDisplay {}
declare class HMDVRDevice {}

interface Navigator {
  getVRDisplays() : PromiseLike<VRDisplay[] | HMDVRDevice[]>
  getVRDevices() : PromiseLike<VRDisplay[] | HMDVRDevice[]>
}

interface NumberConstructor {
  // EPSILON : number
}
