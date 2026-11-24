require 'xcodeproj'
require 'fileutils'
root=File.expand_path('../ios/App', __dir__)
project=Xcodeproj::Project.open(File.join(root,'App.xcodeproj'))
target=project.targets.find{|t|t.name=='App'} or abort 'App target missing'
group=project.main_group.find_subpath('App',false) or abort 'App group missing'
%w[AntBaiduService.h AntBaiduService.m AntBaidu-Bridging.h].each do |name|
  FileUtils.cp(File.expand_path('../native/'+name,__dir__),File.join(root,'App',name))
  ref=group.files.find{|r|r.path==name}||group.new_file(name)
  target.add_file_references([ref]) if name.end_with?('.m') && !target.source_build_phase.files_references.include?(ref)
end
target.build_configurations.each do |c|
 c.build_settings['SWIFT_OBJC_BRIDGING_HEADER']='App/AntBaidu-Bridging.h'
 flags=c.build_settings['OTHER_LDFLAGS']||['$(inherited)']
 flags=flags.split(' ') if flags.is_a?(String)
 c.build_settings['OTHER_LDFLAGS']=(flags+['$(inherited)','-ObjC']).uniq
end
project.save

